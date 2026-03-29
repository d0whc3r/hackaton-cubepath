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

/**
 * Accumulates stream chunks and flushes them in batches to reduce SSE event volume.
 * Flushes when the buffer contains a newline (preserves markdown structure) or
 * reaches MIN_FLUSH_CHARS, whichever comes first. Call `end()` after the stream
 * to flush any remaining bytes.
 */
const MIN_FLUSH_CHARS = 5

export function createChunkBuffer(flush: (text: string) => void): { add: (chunk: string) => void; end: () => void } {
  let buffer = ''

  return {
    add(chunk: string): void {
      buffer += chunk
      if (buffer.includes('\n') || buffer.length >= MIN_FLUSH_CHARS) {
        flush(buffer)
        buffer = ''
      }
    },
    end(): void {
      if (buffer.length > 0) {
        flush(buffer)
        buffer = ''
      }
    },
  }
}

/** Returns a streaming SSE Response with the correct headers. */
export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, { headers: SSE_HEADERS, status: 200 })
}

/**
 * Adapter: creates an OpenAI-compatible client pointed at the Ollama /v1 endpoint.
 * Ollama exposes an OpenAI-compatible API at <baseUrl>/v1, so the OpenAI SDK works
 * as a drop-in driver; no separate Ollama SDK dependency required.
 */
export function ollamaClient(baseUrl: string) {
  return createOpenAI({
    apiKey: 'ollama',
    baseURL: `${baseUrl}/v1`,
    fetch: async (url, options) => {
      // Force keep-alive for streaming
      const headers = new Headers(options?.headers)
      headers.set('Connection', 'keep-alive')

      return fetch(url, {
        ...options,
        headers,
        // Optional: Keep connection alive
        keepalive: true,
      })
    },
  })
}
