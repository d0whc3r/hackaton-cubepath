import { streamText } from 'ai'
import type { ollamaClient, SseEmitter } from '@/lib/api/sse'
import { estimateCost } from '@/lib/cost/calculator'
import { logServer, logServerError } from '@/lib/observability/server'

/** 5 min: specialist models on consumer hardware can be slow for large inputs */
const SPECIALIST_TIMEOUT_MS = 300_000

interface StreamRunnerParams {
  emit: SseEmitter
  input: string
  modelId: string
  ollama: ReturnType<typeof ollamaClient>
  systemPrompt: string
  /** When true, sends a follow-up message if the model stops at the token limit. */
  autoContinue?: boolean
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
  let outputText = ''
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
      outputText += chunk
      emit('response_chunk', { text: chunk })
    }

    if (autoContinue && (await result.finishReason) === 'length' && !abortController.signal.aborted) {
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
        model: ollama(modelId),
        system: systemPrompt,
      })

      for await (const chunk of continuation.textStream) {
        outputText += chunk
        emit('response_chunk', { text: chunk })
      }
    }

    clearTimeout(timeout)
    logServer('info', 'stream.specialist.done', {
      durationMs: Date.now() - startedAt,
      inputSize: input.length,
      modelId,
      outputSize: outputText.length,
    })
    emit('routing_step', { label: 'Response generated', status: 'done', step: 'generating_response' })
    emit('cost', estimateCost(input.length, outputText.length))
    emit('done', {})
  } catch (error) {
    clearTimeout(timeout)
    const isAbort = error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))
    if (isAbort) {
      logServer('warn', 'stream.specialist.aborted', { durationMs: Date.now() - startedAt, modelId })
      emit('interrupted', {})
    } else {
      logServerError('stream.specialist.error', error, { durationMs: Date.now() - startedAt, modelId })
      emit('error', {
        code: 'SPECIALIST_UNAVAILABLE',
        message: 'The specialist model is unavailable. Check Ollama is running.',
      })
    }
  }
}
