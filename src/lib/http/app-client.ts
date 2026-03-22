import wretch from 'wretch'
import { dedupe, retry } from 'wretch-middlewares'
import QueryStringAddon from 'wretch/addons/queryString'

/**
 * Client-side wretch instance for calling the app's own API routes.
 *
 * No fixed base URL — all paths are relative (e.g. `/api/route`), which works in browser context.
 *
 * Addons:
 * - QueryStringAddon: enables `.query({ key: value })` for type-safe URL parameter encoding.
 *
 * Middleware applied globally:
 * - retry: retries on network errors and HTTP 5xx, max 3 attempts, exponential backoff.
 *          HTTP 4xx responses are NOT retried.
 * - dedupe: collapses identical in-flight GET requests.
 *
 * Usage patterns:
 *
 * Non-streaming GET with query params:
 *   await appWretch.url('/api/ollama/models').query({ baseUrl }).options({ signal: abort.signal }).get().json<T>()
 *
 * Streaming POST (.res() bypasses error catchers — check res.ok manually):
 *   const res = await appWretch.url('/api/route').options({ signal }).post(body).res()
 *   // → res.body.getReader() for streaming
 *
 * Overriding defaults for an external URL (does NOT modify the shared instance):
 *   await appWretch.url('https://external.api/v1').options({ credentials: 'include' }).get().json()
 */
export const appWretch = wretch()
  .addon(QueryStringAddon)
  .middlewares([
    retry({
      delayRamp: (delay, attempt) => delay * 2 ** (attempt - 1),
      delayTimer: 500,
      maxAttempts: 3,
      retryOnNetworkError: true,
      until: (res) => res !== null && res !== undefined && res.status < 500,
    }),
    dedupe(),
  ])
