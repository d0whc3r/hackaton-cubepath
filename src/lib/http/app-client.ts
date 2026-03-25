import wretch from 'wretch'
import QueryStringAddon from 'wretch/addons/queryString'
import { REQUEST_ID_HEADER, readHeaderValue, toMethod, withRequestIdHeader } from '@/lib/http/request-trace'
import { logClient, logClientError } from '@/lib/observability/client'

function parseUrl(url: string): { host: string; path: string } {
  try {
    if (url.startsWith('http')) {
      const parsed = new URL(url)
      return { host: parsed.host, path: parsed.pathname }
    }
    // Relative URL — resolve against the current page origin
    const parsed = new URL(url, globalThis.location.origin)
    return { host: parsed.host, path: parsed.pathname }
  } catch {
    return { host: '', path: url }
  }
}

const apiTraceMiddleware =
  (next: (url: string, options: RequestInit) => Promise<Response>) =>
  async (url: string, options: RequestInit = {}) => {
    const method = toMethod(options)
    const { host, path } = parseUrl(url)
    const startedAt = Date.now()
    const requestId = readHeaderValue(options.headers, REQUEST_ID_HEADER) ?? crypto.randomUUID()
    const optionsWithRequestId = withRequestIdHeader(options, requestId)

    logClient('info', 'api.client.request.start', { host, method, path, requestId })

    try {
      const response = await next(url, optionsWithRequestId)
      logClient(response.status >= 400 ? 'warn' : 'info', 'api.client.request.end', {
        durationMs: Date.now() - startedAt,
        host,
        method,
        path,
        requestId,
        status: response.status,
      })
      return response
    } catch (error) {
      logClientError('api.client.request.error', error, {
        durationMs: Date.now() - startedAt,
        host,
        method,
        path,
        requestId,
      })
      throw error
    }
  }

/**
 * Client-side wretch instance for calling the app's own API routes.
 *
 * No fixed base URL; all paths are relative (e.g. `/api/route`), which works in browser context.
 *
 * Addons:
 * - QueryStringAddon: enables `.query({ key: value })` for type-safe URL parameter encoding.
 *
 * Retry and deduplication are delegated to React Query's QueryClient.
 *
 * Usage patterns:
 *
 * Non-streaming GET with query params:
 *   await appWretch.url('/api/ollama/models').query({ baseUrl }).options({ signal: abort.signal }).get().json<T>()
 *
 * Streaming POST (.res() bypasses error catchers; check res.ok manually):
 *   const res = await appWretch.url('/api/route').options({ signal }).post(body).res()
 *   // → res.body.getReader() for streaming
 *
 * Overriding defaults for an external URL (does NOT modify the shared instance):
 *   await appWretch.url('https://external.api/v1').options({ credentials: 'include' }).get().json()
 */
export const appWretch = wretch().addon(QueryStringAddon).middlewares([apiTraceMiddleware])
