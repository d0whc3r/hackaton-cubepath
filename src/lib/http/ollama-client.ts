import wretch from 'wretch'
import { logServer, logServerError } from '@/lib/observability/server'

function toMethod(options?: RequestInit): string {
  return options?.method?.toUpperCase() ?? 'GET'
}

const ollamaTraceMiddleware = ((next: (url: string, options: RequestInit) => Promise<Response>) =>
  async (url: string, options: RequestInit = {}) => {
    const method = toMethod(options)
    const startedAt = Date.now()

    logServer('info', 'ollama.request.start', { method, url })

    try {
      const response = await next(url, options)
      const level = response.status >= 500 ? 'error' : response.status >= 400 ? 'warn' : 'info'
      logServer(level, 'ollama.request.end', {
        durationMs: Date.now() - startedAt,
        method,
        status: response.status,
        url,
      })
      return response
    } catch (error) {
      logServerError('ollama.request.error', error, { durationMs: Date.now() - startedAt, method, url })
      throw error
    }
  }) as any

/**
 * Server-side wretch instance for calling the Ollama API.
 *
 * No fixed base URL; callers pass the full endpoint URL via `.url(fullUrl)` because
 * the Ollama base URL is dynamic (supplied per-request from query params or request body).
 *
 * Retry and deduplication are handled by React Query's QueryClient on the client side.
 * Server-side API routes handle errors via try/catch.
 *
 * Usage patterns:
 *
 * Non-streaming:
 *   await ollamaWretch.url(`${baseUrl}/api/tags`).options({ signal: AbortSignal.timeout(5000) }).get().json<T>()
 *
 * Streaming (.res() bypasses error catchers; check res.ok manually):
 *   const res = await ollamaWretch.url(`${baseUrl}/api/pull`).options({ signal: s }).post(body).res()
 *   // → res.body.getReader() for streaming
 *
 * Overriding defaults for a specific call (does NOT modify the shared instance):
 *   await ollamaWretch.url('https://other.api/path').options({ credentials: 'include' }).get().json()
 */
export const ollamaWretch = wretch().middlewares([ollamaTraceMiddleware])
