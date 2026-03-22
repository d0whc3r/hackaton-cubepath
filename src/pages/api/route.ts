import type { APIRoute } from 'astro'

import { streamText } from 'ai'

import type { SseEmitter } from '@/lib/api/sse'
import type { RoutingDecision } from '@/lib/router/types'
import type { TaskType } from '@/lib/schemas/route'

import { resolveModel } from '@/lib/api/resolve-model'
import { createSseStream, ollamaClient, sseResponse } from '@/lib/api/sse'
import { estimateCost } from '@/lib/cost/calculator'
import { routeWithAnalyst } from '@/lib/router/index'
import { DEFAULT_ANALYST_MODEL, DEFAULT_MODELS, OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'
import { buildSpecialists } from '@/lib/router/specialists'
import { RouteRequestSchema } from '@/lib/schemas/route'

/** 5 min: specialist models on consumer hardware can be slow for large inputs */
const SPECIALIST_TIMEOUT_MS = 300_000

interface ValidatedRequest {
  analystModel: string
  commitModel: string
  explainModel: string
  input: string
  ollamaBaseUrl: string
  refactorModel: string
  taskType: 'explain' | 'test' | 'refactor' | 'commit'
  testModel: string
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

function buildSSEStream(req: ValidatedRequest): ReadableStream {
  const baseUrl = req.ollamaBaseUrl

  const specialists = buildSpecialists({
    commitModel: req.commitModel,
    explainModel: req.explainModel,
    refactorModel: req.refactorModel,
    testModel: req.testModel,
  })

  return createSseStream(async (emit) => {
    try {
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
    explainModel: resolveModel(data.explainModel, import.meta.env.OLLAMA_EXPLAIN_MODEL, DEFAULT_MODELS.explain),
    input: data.input,
    ollamaBaseUrl: resolveModel(data.ollamaBaseUrl, import.meta.env.OLLAMA_BASE_URL, OLLAMA_BASE_URL_DEFAULT),
    refactorModel: resolveModel(data.refactorModel, import.meta.env.OLLAMA_REFACTOR_MODEL, DEFAULT_MODELS.refactor),
    taskType: data.taskType,
    testModel: resolveModel(data.testModel, import.meta.env.OLLAMA_TEST_MODEL, DEFAULT_MODELS.test),
  }

  const stream = buildSSEStream(req)

  return sseResponse(stream)
}
