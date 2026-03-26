import type { APIRoute } from 'astro'
import type { SseEmitter } from '@/lib/api/sse'
import type { DirectTaskType } from '@/lib/router/direct'
import type { TaskType } from '@/lib/schemas/route'
import { resolveModel } from '@/lib/api/resolve-model'
import { createSseStream, ollamaClient, sseResponse } from '@/lib/api/sse'
import { runStream } from '@/lib/api/stream-runner'
import { withApiLogging } from '@/lib/observability/api'
import { recordRouteBlocked, recordRouteRequest } from '@/lib/observability/metrics'
import { logServer, logServerError } from '@/lib/observability/server'
import { appendEvent, buildValidationEvent, validateInputSemantic } from '@/lib/railguard'
import { detectLanguage } from '@/lib/router/detector'
import { isDirectTask, routeDirect } from '@/lib/router/direct'
import { routeWithAnalyst } from '@/lib/router/index'
import { DEFAULT_ANALYST_MODEL, DEFAULT_MODELS, OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'
import { buildSpecialists } from '@/lib/router/specialists'
import { emitLanguageDetection, emitSpecialistSelection, emitTaskAnalysis } from '@/lib/router/sse-emitters'
import { RouteRequestSchema } from '@/lib/schemas/route'

interface ValidatedRequest {
  analystModel: string
  commitModel: string
  deadCodeModel: string
  docstringModel: string
  errorExplainModel: string
  explainModel: string
  input: string
  namingHelperModel: string
  ollamaBaseUrl: string
  performanceHintModel: string
  refactorModel: string
  taskType: TaskType
  testModel: string
  typeHintsModel: string
}

const DIRECT_TASK_MODEL_KEY: Record<DirectTaskType, keyof ValidatedRequest> = {
  'dead-code': 'deadCodeModel',
  docstring: 'docstringModel',
  'error-explain': 'errorExplainModel',
  'naming-helper': 'namingHelperModel',
  'performance-hint': 'performanceHintModel',
  'type-hints': 'typeHintsModel',
}

async function buildDirectStream(req: ValidatedRequest, emit: SseEmitter): Promise<void> {
  if (!isDirectTask(req.taskType)) {
    return
  }

  const resolvedModelId = req[DIRECT_TASK_MODEL_KEY[req.taskType]] as string
  const { displayName, modelId, systemPrompt } = routeDirect(req.taskType, resolvedModelId)
  const { language } = detectLanguage(req.input)

  emit('routing_step', { label: 'Analysing code...', status: 'active', step: 'detecting_language' })
  emit('routing_step', { detail: language, label: `${language} detected`, status: 'done', step: 'detecting_language' })
  emit('routing_step', { label: 'Analysing task type...', status: 'active', step: 'analyzing_task' })
  emit('routing_step', { detail: req.taskType, label: `Task: ${req.taskType}`, status: 'done', step: 'analyzing_task' })
  emit('specialist_selected', {
    displayName: `${displayName} Specialist`,
    language,
    modelId,
    specialistId: `${req.taskType}-specialist`,
  })
  emit('routing_step', { label: 'Generating response...', status: 'active', step: 'generating_response' })

  await runStream({ emit, input: req.input, modelId, ollama: ollamaClient(req.ollamaBaseUrl), systemPrompt })
}

function buildSSEStream(req: ValidatedRequest, requestId: string): ReadableStream {
  return createSseStream(async (emit) => {
    try {
      if (isDirectTask(req.taskType)) {
        await buildDirectStream(req, emit)
        return
      }

      const specialists = buildSpecialists({
        commitModel: req.commitModel,
        explainModel: req.explainModel,
        refactorModel: req.refactorModel,
        testModel: req.testModel,
      })

      emit('routing_step', { label: 'Analysing code...', status: 'active', step: 'detecting_language' })

      const decision = await routeWithAnalyst(req.taskType, req.input, specialists, req.analystModel, req.ollamaBaseUrl)

      emitLanguageDetection(decision, emit)
      emitTaskAnalysis(req.taskType, emit)
      emitSpecialistSelection(decision, emit)

      emit('routing_step', { label: 'Generating response...', status: 'active', step: 'generating_response' })

      await runStream({
        autoContinue: true,
        emit,
        input: req.input,
        modelId: decision.specialist.modelId,
        ollama: ollamaClient(req.ollamaBaseUrl),
        systemPrompt: decision.systemPrompt,
      })
    } catch (error) {
      logServerError('route.stream.failed', error, {
        requestId,
        taskType: req.taskType,
      })
      emit('error', { code: 'INTERNAL', message: 'Internal error. Please try again.' })
    }
  })
}

function buildRequest(data: ReturnType<typeof RouteRequestSchema.parse>): ValidatedRequest {
  return {
    analystModel: resolveModel(data.analystModel, DEFAULT_ANALYST_MODEL),
    commitModel: resolveModel(data.commitModel, DEFAULT_MODELS.commit),
    deadCodeModel: resolveModel(data.deadCodeModel, DEFAULT_MODELS['dead-code']),
    docstringModel: resolveModel(data.docstringModel, DEFAULT_MODELS.docstring),
    errorExplainModel: resolveModel(data.errorExplainModel, DEFAULT_MODELS['error-explain']),
    explainModel: resolveModel(data.explainModel, DEFAULT_MODELS.explain),
    input: data.input,
    namingHelperModel: resolveModel(data.namingHelperModel, DEFAULT_MODELS['naming-helper']),
    ollamaBaseUrl: resolveModel(data.ollamaBaseUrl, OLLAMA_BASE_URL_DEFAULT),
    performanceHintModel: resolveModel(data.performanceHintModel, DEFAULT_MODELS['performance-hint']),
    refactorModel: resolveModel(data.refactorModel, DEFAULT_MODELS.refactor),
    taskType: data.taskType,
    testModel: resolveModel(data.testModel, DEFAULT_MODELS.test),
    typeHintsModel: resolveModel(data.typeHintsModel, DEFAULT_MODELS['type-hints']),
  }
}

export const POST: APIRoute = withApiLogging('route.main', async ({ request }, requestId) => {
  let rawBody
  try {
    rawBody = await request.json()
  } catch {
    logServer('warn', 'route.invalid_json', { requestId })
    return Response.json({ error: 'INVALID_JSON', message: 'Request body must be valid JSON' }, { status: 400 })
  }

  const parsed = RouteRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request'
    logServer('warn', 'route.validation_error', { message, requestId })
    return Response.json({ error: 'VALIDATION_ERROR', message }, { status: 400 })
  }

  const { data } = parsed

  const req = buildRequest(data)

  // [railguard] semantic validation; task-aware AI check
  const semanticValidation = await validateInputSemantic(data.input, data.taskType, req.ollamaBaseUrl)
  appendEvent(buildValidationEvent(semanticValidation, data.input))
  if (semanticValidation.decision === 'blocked') {
    logServer('warn', 'route.blocked_by_railguard', {
      blockReason: semanticValidation.blockReason,
      requestId,
      taskType: data.taskType,
    })
    recordRouteBlocked(data.taskType)
    return Response.json(
      {
        blockReason: semanticValidation.blockReason ?? 'The request does not appear to match the selected task type.',
        error: 'BLOCKED_BY_SECURITY_POLICY',
      },
      { status: 400 },
    )
  }

  logServer('info', 'route.accepted', { requestId, taskType: data.taskType })
  recordRouteRequest(data.taskType)
  return sseResponse(buildSSEStream(req, requestId))
})
