import { APICallError, streamText } from 'ai'
import type { ollamaClient, SseEmitter } from '@/lib/api/sse'
import { estimateCost } from '@/lib/cost/calculator'
import { recordStreamChars, recordStreamDuration } from '@/lib/observability/metrics'
import { logServer, logServerError } from '@/lib/observability/server'

/** 5 min: specialist models on consumer hardware can be slow for large inputs */
const SPECIALIST_TIMEOUT_MS = 300_000

function parseOllamaError(error: unknown, modelId: string): { code: string; message: string } {
  // AI SDK HTTP-level errors (model not found, server errors, etc.)
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 404) {
      try {
        const body = JSON.parse(error.responseBody ?? '{}') as { error?: string }
        if (body.error) {
          return { code: 'MODEL_NOT_FOUND', message: body.error }
        }
      } catch {
        /* Ignore malformed body */
      }
      return {
        code: 'MODEL_NOT_FOUND',
        message: `Model "${modelId}" not found. Run: ollama pull ${modelId}`,
      }
    }
    if (error.statusCode === 400 || error.statusCode === 500) {
      try {
        const body = JSON.parse(error.responseBody ?? '{}') as { error?: string }
        if (body.error) {
          return { code: 'OLLAMA_ERROR', message: body.error }
        }
      } catch {
        /* Ignore malformed body */
      }
    }
  }

  // Network-level errors (Ollama not running, port refused, DNS failure)
  if (error instanceof Error) {
    const combined =
      `${error.message} ${error.cause instanceof Error ? error.cause.message : String(error.cause ?? '')}`.toLowerCase()
    if (
      combined.includes('econnrefused') ||
      combined.includes('fetch failed') ||
      combined.includes('connection refused') ||
      combined.includes('enotfound')
    ) {
      return {
        code: 'OLLAMA_UNREACHABLE',
        message: "Cannot connect to Ollama. Make sure it's running on your machine.",
      }
    }
  }

  return {
    code: 'SPECIALIST_UNAVAILABLE',
    message: 'The specialist model is unavailable. Check Ollama is running.',
  }
}

/** Guard against unbounded continuation payloads on very long outputs. */
const MAX_OUTPUT_CHARS = 50_000

/** How many chars of prior output to include as context for the continuation request. */
const CONTINUATION_CONTEXT_CHARS = 2000

interface StreamRunnerParams {
  emit: SseEmitter
  input: string
  modelId: string
  ollama: ReturnType<typeof ollamaClient>
  systemPrompt: string
  /** When true, sends a follow-up message if the model stops at the token limit. */
  autoContinue?: boolean
}

async function emitTruncationWarningIfNeeded(
  emit: SseEmitter,
  finishReason: PromiseLike<string | null | undefined>,
): Promise<void> {
  if ((await finishReason) !== 'length') {
    return
  }

  emit('routing_step', {
    detail: 'Response was truncated after the continuation. Try a shorter input.',
    label: 'Response truncated',
    status: 'error',
    step: 'generating_response',
  })
}

/**
 * Streams a model response with a 5-minute abort timeout.
 *
 * Emits `response_chunk` for each token, then `cost` and `done` on success.
 * Emits `interrupted` on user/timeout abort, or `error` if the model is unreachable.
 */
export async function runStream({
  autoContinue = false,
  emit,
  input,
  modelId,
  ollama,
  systemPrompt,
}: StreamRunnerParams): Promise<void> {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), SPECIALIST_TIMEOUT_MS)
  const outputChunks: string[] = []
  const startedAt = Date.now()

  logServer('info', 'stream.specialist.start', { autoContinue, inputSize: input.length, modelId })

  try {
    const result = streamText({
      abortSignal: abortController.signal,
      model: ollama(modelId),
      prompt: input,
      system: systemPrompt,
    })

    for await (const chunk of result.textStream) {
      outputChunks.push(chunk)
      emit('response_chunk', { text: chunk })
    }

    const outputText = outputChunks.join('')

    if (
      autoContinue &&
      outputText.length < MAX_OUTPUT_CHARS &&
      (await result.finishReason) === 'length' &&
      !abortController.signal.aborted
    ) {
      // Truncate prior output to the last N chars so the continuation payload
      // Stays bounded regardless of how long the initial response was.
      const contextForContinuation = outputText.slice(-CONTINUATION_CONTEXT_CHARS)
      const continuation = streamText({
        abortSignal: abortController.signal,
        messages: [
          { content: input, role: 'user' },
          { content: contextForContinuation, role: 'assistant' },
          {
            content: 'Continue exactly from where you left off. Do not repeat anything already written.',
            role: 'user',
          },
        ],
        model: ollama(modelId),
        system: systemPrompt,
      })

      for await (const chunk of continuation.textStream) {
        outputChunks.push(chunk)
        emit('response_chunk', { text: chunk })
      }

      await emitTruncationWarningIfNeeded(emit, continuation.finishReason)
    }

    clearTimeout(timeout)
    const totalOutputChars = outputChunks.reduce((sum, c) => sum + c.length, 0)
    const durationMs = Date.now() - startedAt
    logServer('info', 'stream.specialist.done', {
      durationMs,
      inputSize: input.length,
      modelId,
      outputSize: totalOutputChars,
    })
    recordStreamDuration(modelId, durationMs, 'done')
    recordStreamChars(modelId, input.length, totalOutputChars)
    emit('routing_step', { label: 'Response generated', status: 'done', step: 'generating_response' })
    emit('cost', estimateCost(input.length, totalOutputChars))
    emit('done', {})
  } catch (error) {
    clearTimeout(timeout)
    const isAbort = error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))
    const durationMs = Date.now() - startedAt
    if (isAbort) {
      logServer('warn', 'stream.specialist.aborted', { durationMs, modelId })
      recordStreamDuration(modelId, durationMs, 'aborted')
      emit('interrupted', {})
    } else {
      logServerError('stream.specialist.error', error, { durationMs, modelId })
      recordStreamDuration(modelId, durationMs, 'error')
      emit('error', parseOllamaError(error, modelId))
    }
  }
}
