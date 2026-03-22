import { createOpenAI } from '@ai-sdk/openai'

export const SSE_HEADERS = {
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Content-Type': 'text/event-stream',
} as const

export type SseEmitter = (event: string, data: unknown) => void

export function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

/**
 * Wraps an async handler in a ReadableStream that:
 * - provides a typed `emit(event, data)` helper
 * - closes the stream when the handler resolves or throws
 */
export function createSseStream(handler: (emit: SseEmitter) => Promise<void>): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const emit: SseEmitter = (event, data) => controller.enqueue(enc.encode(sseEvent(event, data)))
      try {
        await handler(emit)
      } finally {
        controller.close()
      }
    },
  })
}

/** Returns a streaming SSE Response with the correct headers. */
export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, { headers: SSE_HEADERS, status: 200 })
}

/**
 * Adapter: creates an OpenAI-compatible client pointed at the Ollama /v1 endpoint.
 * Ollama exposes an OpenAI-compatible API at <baseUrl>/v1, so the OpenAI SDK works
 * as a drop-in driver — no separate Ollama SDK dependency required.
 */
export function ollamaClient(baseUrl: string) {
  return createOpenAI({ apiKey: 'ollama', baseURL: `${baseUrl}/v1` })
}
