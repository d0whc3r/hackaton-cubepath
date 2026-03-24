import type { APIRoute } from 'astro'
import type { SseEmitter } from '@/lib/api/sse'
import type { DirectTaskType } from '@/lib/router/direct'
import type { TaskType } from '@/lib/schemas/route'
import { resolveModel } from '@/lib/api/resolve-model'
import { createSseStream, ollamaClient, sseResponse } from '@/lib/api/sse'
import { runStream } from '@/lib/api/stream-runner'
import { withApiLogging } from '@/lib/observability/api'
import { logServer, logServerError } from '@/lib/observability/server'
import { appendEvent, buildValidationEvent, DEFAULT_GUARD_MODEL, validateInputSemantic } from '@/lib/railguard'
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
  guardModel: string
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
    analystModel: resolveModel(data.analystModel, import.meta.env.OLLAMA_ANALYST_MODEL, DEFAULT_ANALYST_MODEL),
    commitModel: resolveModel(data.commitModel, import.meta.env.OLLAMA_COMMIT_MODEL, DEFAULT_MODELS.commit),
    deadCodeModel: resolveModel(
      data.deadCodeModel,
      import.meta.env.OLLAMA_DEAD_CODE_MODEL,
      DEFAULT_MODELS['dead-code'],
    ),
    docstringModel: resolveModel(data.docstringModel, import.meta.env.OLLAMA_DOCSTRING_MODEL, DEFAULT_MODELS.docstring),
    errorExplainModel: resolveModel(
      data.errorExplainModel,
      import.meta.env.OLLAMA_ERROR_EXPLAIN_MODEL,
      DEFAULT_MODELS['error-explain'],
    ),
    explainModel: resolveModel(data.explainModel, import.meta.env.OLLAMA_EXPLAIN_MODEL, DEFAULT_MODELS.explain),
    guardModel: resolveModel(data.guardModel, import.meta.env.OLLAMA_GUARD_MODEL, DEFAULT_GUARD_MODEL),
    input: data.input,
    namingHelperModel: resolveModel(
      data.namingHelperModel,
      import.meta.env.OLLAMA_NAMING_HELPER_MODEL,
      DEFAULT_MODELS['naming-helper'],
    ),
    ollamaBaseUrl: resolveModel(data.ollamaBaseUrl, import.meta.env.OLLAMA_BASE_URL, OLLAMA_BASE_URL_DEFAULT),
    performanceHintModel: resolveModel(
      data.performanceHintModel,
      import.meta.env.OLLAMA_PERFORMANCE_HINT_MODEL,
      DEFAULT_MODELS['performance-hint'],
    ),
    refactorModel: resolveModel(data.refactorModel, import.meta.env.OLLAMA_REFACTOR_MODEL, DEFAULT_MODELS.refactor),
    taskType: data.taskType,
    testModel: resolveModel(data.testModel, import.meta.env.OLLAMA_TEST_MODEL, DEFAULT_MODELS.test),
    typeHintsModel: resolveModel(
      data.typeHintsModel,
      import.meta.env.OLLAMA_TYPE_HINTS_MODEL,
      DEFAULT_MODELS['type-hints'],
    ),
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
  const semanticValidation = await validateInputSemantic(data.input, data.taskType, req.ollamaBaseUrl, req.guardModel)
  appendEvent(buildValidationEvent(semanticValidation, data.input))
  if (semanticValidation.decision === 'blocked') {
    logServer('warn', 'route.blocked_by_railguard', {
      blockReason: semanticValidation.blockReason,
      requestId,
      taskType: data.taskType,
    })
    return Response.json(
      {
        blockReason: semanticValidation.blockReason ?? 'The request does not appear to match the selected task type.',
        error: 'BLOCKED_BY_SECURITY_POLICY',
      },
      { status: 400 },
    )
  }

  logServer('info', 'route.accepted', { requestId, taskType: data.taskType })
  return sseResponse(buildSSEStream(req, requestId))
})
