import type { APIRoute } from 'astro'

import { streamText } from 'ai'

import type { SseEmitter } from '@/lib/api/sse'
import type { DirectTaskType } from '@/lib/router/direct'
import type { RoutingDecision } from '@/lib/router/types'
import type { TaskType } from '@/lib/schemas/route'

import { resolveModel } from '@/lib/api/resolve-model'
import { createSseStream, ollamaClient, sseResponse } from '@/lib/api/sse'
import { estimateCost } from '@/lib/cost/calculator'
import { detectLanguage } from '@/lib/router/detector'
import { isDirectTask, routeDirect } from '@/lib/router/direct'
import { routeWithAnalyst } from '@/lib/router/index'
import { DEFAULT_ANALYST_MODEL, DEFAULT_MODELS, OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'
import { buildSpecialists } from '@/lib/router/specialists'
import { RouteRequestSchema } from '@/lib/schemas/route'

/** 5 min: specialist models on consumer hardware can be slow for large inputs */
const SPECIALIST_TIMEOUT_MS = 300_000

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

function emitLanguageDetection(decision: RoutingDecision, emit: SseEmitter): void {
  emit('routing_step', {
    detail: decision.codeContext.language,
    label: `${decision.codeContext.language} detected`,
    status: 'done',
    step: 'detecting_language',
  })
}

function emitTaskAnalysis(taskType: TaskType, emit: SseEmitter): void {
  emit('routing_step', { label: 'Analysing task type...', status: 'active', step: 'analyzing_task' })
  emit('routing_step', {
    detail: taskType,
    label: `Task: ${taskType}`,
    status: 'done',
    step: 'analyzing_task',
  })
}

function emitSpecialistSelection(decision: RoutingDecision, emit: SseEmitter): void {
  emit('routing_step', { label: 'Selecting specialist...', status: 'active', step: 'selecting_specialist' })
  emit('routing_step', {
    label: `${decision.specialist.displayName} selected`,
    status: 'done',
    step: 'selecting_specialist',
  })
  emit('specialist_selected', {
    displayName: decision.specialist.displayName,
    language: decision.codeContext.language,
    modelId: decision.specialist.modelId,
    reason: decision.routingReason,
    specialistId: decision.specialist.id,
  })
}

async function streamSpecialistResponse(
  ollama: ReturnType<typeof ollamaClient>,
  decision: RoutingDecision,
  input: string,
  systemPrompt: string,
  emit: SseEmitter,
): Promise<void> {
  const abortController = new AbortController()
  // 5 min: specialist models on consumer hardware can be slow for large inputs — generous timeout avoids cutting off long refactors or test generation
  const timeout = setTimeout(() => abortController.abort(), SPECIALIST_TIMEOUT_MS)
  let outputText = ''

  try {
    const result = streamText({
      abortSignal: abortController.signal,
      model: ollama(decision.specialist.modelId),
      prompt: input,
      system: systemPrompt,
    })

    for await (const chunk of result.textStream) {
      outputText += chunk
      emit('response_chunk', { text: chunk })
    }

    const finishReason = await result.finishReason

    // Auto-continue when the model hit the token limit mid-response
    if (finishReason === 'length' && !abortController.signal.aborted) {
      const continuation = streamText({
        abortSignal: abortController.signal,
        messages: [
          { content: input, role: 'user' },
          { content: outputText, role: 'assistant' },
          {
            content: 'Continue exactly from where you left off. Do not repeat anything already written.',
            role: 'user',
          },
        ],
        model: ollama(decision.specialist.modelId),
        system: systemPrompt,
      })

      for await (const chunk of continuation.textStream) {
        outputText += chunk
        emit('response_chunk', { text: chunk })
      }
    }

    clearTimeout(timeout)
    emit('routing_step', { label: 'Response generated', status: 'done', step: 'generating_response' })
    emit('cost', estimateCost(input.length, outputText.length))
    emit('done', {})
  } catch (error) {
    clearTimeout(timeout)
    const isAbort = error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))
    if (isAbort) {
      emit('interrupted', {})
    } else {
      emit('error', {
        code: 'SPECIALIST_UNAVAILABLE',
        message: 'The specialist model is unavailable. Check Ollama is running.',
      })
    }
  }
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

  emit('routing_step', { label: 'Analysing code...', status: 'active', step: 'detecting_language' })
  const { language } = detectLanguage(req.input)
  emit('routing_step', {
    detail: language,
    label: `${language} detected`,
    status: 'done',
    step: 'detecting_language',
  })

  emit('routing_step', { label: 'Analysing task type...', status: 'active', step: 'analyzing_task' })
  emit('routing_step', {
    detail: req.taskType,
    label: `Task: ${req.taskType}`,
    status: 'done',
    step: 'analyzing_task',
  })

  emit('specialist_selected', {
    displayName: `${displayName} Specialist`,
    language,
    modelId,
    specialistId: `${req.taskType}-specialist`,
  })

  emit('routing_step', { label: 'Generating response...', status: 'active', step: 'generating_response' })

  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), SPECIALIST_TIMEOUT_MS)
  const ollama = ollamaClient(req.ollamaBaseUrl)
  let outputText = ''

  try {
    const result = streamText({
      abortSignal: abortController.signal,
      model: ollama(modelId),
      prompt: req.input,
      system: systemPrompt,
    })

    for await (const chunk of result.textStream) {
      outputText += chunk
      emit('response_chunk', { text: chunk })
    }

    clearTimeout(timeout)
    emit('routing_step', { label: 'Response generated', status: 'done', step: 'generating_response' })
    emit('cost', estimateCost(req.input.length, outputText.length))
    emit('done', {})
  } catch (error) {
    clearTimeout(timeout)
    const isAbort = error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))
    if (isAbort) {
      emit('interrupted', {})
    } else {
      emit('error', {
        code: 'SPECIALIST_UNAVAILABLE',
        message: 'The specialist model is unavailable. Check Ollama is running.',
      })
    }
  }
}

function buildSSEStream(req: ValidatedRequest): ReadableStream {
  const baseUrl = req.ollamaBaseUrl

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

      const decision = await routeWithAnalyst(req.taskType, req.input, specialists, req.analystModel, baseUrl)

      emitLanguageDetection(decision, emit)
      emitTaskAnalysis(req.taskType, emit)
      emitSpecialistSelection(decision, emit)

      emit('routing_step', { label: 'Generating response...', status: 'active', step: 'generating_response' })

      const ollama = ollamaClient(baseUrl)
      await streamSpecialistResponse(ollama, decision, req.input, decision.systemPrompt, emit)
    } catch {
      emit('error', { code: 'INTERNAL', message: 'Internal error. Please try again.' })
    }
  })
}

export const POST: APIRoute = async ({ request }) => {
  let rawBody
  try {
    rawBody = await request.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON', message: 'Request body must be valid JSON' }, { status: 400 })
  }

  const parsed = RouteRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request'
    return Response.json({ error: 'VALIDATION_ERROR', message }, { status: 400 })
  }

  const { data } = parsed

  const req: ValidatedRequest = {
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

  const stream = buildSSEStream(req)

  return sseResponse(stream)
}
