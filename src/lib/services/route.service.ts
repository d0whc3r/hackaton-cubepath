import type { MutationOptions } from '@tanstack/react-query'
import type { SseEmitter } from '@/lib/api/sse'
import type { DirectTaskType } from '@/lib/router/direct'
import type { RouteRequest, TaskType } from '@/lib/schemas/route'
import type { SSECallbacks } from '@/lib/utils/sse'
import { resolveValue } from '@/lib/api/resolve-model'
import { ollamaClient } from '@/lib/api/sse'
import { runStream } from '@/lib/api/stream-runner'
import { logClientError } from '@/lib/observability/client'
import { appendEvent, buildValidationEvent, validateInputSemantic } from '@/lib/railguard'
import { detectLanguage } from '@/lib/router/detector'
import { isDirectTask, routeDirect } from '@/lib/router/direct'
import { routeWithAnalyst } from '@/lib/router/index'
import { DEFAULT_MODELS } from '@/lib/router/models'
import { buildSpecialists } from '@/lib/router/specialists'
import { emitLanguageDetection, emitSpecialistSelection, emitTaskAnalysis } from '@/lib/router/sse-emitters'
import { DEFAULT_ANALYST_MODEL } from '../router/models/analyst'
import { OLLAMA_BASE_URL_DEFAULT } from '../router/ollama-defaults'

interface RouteStreamParams extends RouteRequest {
  signal: AbortSignal
  callbacks: SSECallbacks
}

export class BlockedError extends Error {
  // oxlint-disable-next-line typescript/parameter-properties
  constructor(public readonly blockReason: string) {
    super('Input blocked by security policy.')
    this.name = 'BlockedError'
  }
}

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

function buildRequest(data: RouteRequest): ValidatedRequest {
  return {
    analystModel: resolveValue(data.analystModel, DEFAULT_ANALYST_MODEL),
    commitModel: resolveValue(data.commitModel, DEFAULT_MODELS.commit),
    deadCodeModel: resolveValue(data.deadCodeModel, DEFAULT_MODELS['dead-code']),
    docstringModel: resolveValue(data.docstringModel, DEFAULT_MODELS.docstring),
    errorExplainModel: resolveValue(data.errorExplainModel, DEFAULT_MODELS['error-explain']),
    explainModel: resolveValue(data.explainModel, DEFAULT_MODELS.explain),
    input: data.input,
    namingHelperModel: resolveValue(data.namingHelperModel, DEFAULT_MODELS['naming-helper']),
    ollamaBaseUrl: resolveValue(data.ollamaBaseUrl, OLLAMA_BASE_URL_DEFAULT),
    performanceHintModel: resolveValue(data.performanceHintModel, DEFAULT_MODELS['performance-hint']),
    refactorModel: resolveValue(data.refactorModel, DEFAULT_MODELS.refactor),
    taskType: data.taskType,
    testModel: resolveValue(data.testModel, DEFAULT_MODELS.test),
    typeHintsModel: resolveValue(data.typeHintsModel, DEFAULT_MODELS['type-hints']),
  }
}

function callbacksToEmitter(callbacks: SSECallbacks): SseEmitter {
  return (event, data) => {
    const parsedData = data as Record<string, unknown>
    switch (event) {
      case 'routing_step': {
        callbacks.onRoutingStep(parsedData as Parameters<SSECallbacks['onRoutingStep']>[0])
        break
      }
      case 'specialist_selected': {
        callbacks.onSpecialistSelected(parsedData as Parameters<SSECallbacks['onSpecialistSelected']>[0])
        break
      }
      case 'response_chunk': {
        callbacks.onResponseChunk(parsedData.text as string)
        break
      }
      case 'cost': {
        callbacks.onCost(parsedData as Parameters<SSECallbacks['onCost']>[0])
        break
      }
      case 'done': {
        callbacks.onDone()
        break
      }
      case 'interrupted': {
        callbacks.onInterrupted()
        break
      }
      case 'error': {
        callbacks.onError({ code: (parsedData.code as string) ?? 'UNKNOWN', message: parsedData.message as string })
        break
      }
    }
  }
}

async function runDirectTask(req: ValidatedRequest, emit: SseEmitter): Promise<void> {
  const modelKey = DIRECT_TASK_MODEL_KEY[req.taskType as DirectTaskType]
  const resolvedModelId = req[modelKey]
  if (!resolvedModelId) {
    emit('error', { code: 'INTERNAL', message: 'No model configured for this task.' })
    return
  }
  const { displayName, modelId, systemPrompt } = routeDirect(req.taskType as DirectTaskType, resolvedModelId)
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

export function buildRouteMutationOptions(): MutationOptions<void, Error, RouteStreamParams> {
  return {
    mutationFn: async ({ signal: _signal, callbacks, ...body }: RouteStreamParams) => {
      const req = buildRequest(body)
      const emit = callbacksToEmitter(callbacks)

      const semanticValidation = await validateInputSemantic(body.input, body.taskType, req.ollamaBaseUrl)
      appendEvent(buildValidationEvent(semanticValidation, body.input))
      if (semanticValidation.decision === 'blocked') {
        throw new BlockedError(
          semanticValidation.blockReason ?? 'The request does not appear to match the selected task type.',
        )
      }

      try {
        if (isDirectTask(req.taskType)) {
          await runDirectTask(req, emit)
          return
        }

        const specialists = buildSpecialists({
          commitModel: req.commitModel,
          explainModel: req.explainModel,
          refactorModel: req.refactorModel,
          testModel: req.testModel,
        })

        emit('routing_step', { label: 'Analysing code...', status: 'active', step: 'detecting_language' })

        const decision = await routeWithAnalyst(
          req.taskType,
          req.input,
          specialists,
          req.analystModel,
          req.ollamaBaseUrl,
        )

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
        logClientError('route.stream.failed', error, { taskType: req.taskType })
        emit('error', { code: 'INTERNAL', message: 'Internal error. Please try again.' })
      }
    },
    mutationKey: ['route'],
  }
}
