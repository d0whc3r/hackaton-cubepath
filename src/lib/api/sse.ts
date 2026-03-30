import { createOpenAI } from '@ai-sdk/openai'

export type SseEmitter = (event: string, data: unknown) => void

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
