import wretch from 'wretch'
import { dedupe, retry } from 'wretch-middlewares'

/**
 * Server-side wretch instance for calling the Ollama API.
 *
 * No fixed base URL — callers pass the full endpoint URL via `.url(fullUrl)` because
 * the Ollama base URL is dynamic (supplied per-request from query params or request body).
 *
 * Middleware applied globally:
 * - retry: retries on network errors and HTTP 5xx, max 3 attempts, exponential backoff.
 *          HTTP 4xx responses are NOT retried (they indicate a client-side problem).
 * - dedupe: collapses identical in-flight GET requests.
 *
 * Usage patterns:
 *
 * Non-streaming:
 *   await ollamaWretch.url(`${baseUrl}/api/tags`).options({ signal: AbortSignal.timeout(5000) }).get().json<T>()
 *
 * Streaming (.res() bypasses error catchers — check res.ok manually):
 *   const res = await ollamaWretch.url(`${baseUrl}/api/pull`).options({ signal: s }).post(body).res()
 *   // → res.body.getReader() for streaming
 *
 * Overriding defaults for a specific call (does NOT modify the shared instance):
 *   await ollamaWretch.url('https://other.api/path').options({ credentials: 'include' }).get().json()
 */
export const ollamaWretch = wretch().middlewares([
  retry({
    delayRamp: (delay, attempt) => delay * 2 ** (attempt - 1),
    delayTimer: 500,
    maxAttempts: 3,
    retryOnNetworkError: true,
    until: (res) => res !== null && res !== undefined && res.status < 500,
  }),
  dedupe(),
])
