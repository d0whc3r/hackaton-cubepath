import { appWretch } from '@/lib/http/app-client'

export const PULL_TIMEOUT_MS = 600_000

export interface PullEvent {
  completed?: number
  error?: string
  status?: string
  total?: number
}

export type PullResult = { type: 'success' } | { message: string; type: 'error' } | { type: 'ended' }

/**
 * Streams a model pull from Ollama's /api/pull endpoint.
 * Parses NDJSON events and calls `onProgress` for each intermediate event.
 * Returns a discriminated union indicating the final outcome.
 * Throws on AbortError or unrecoverable network failure.
 */
export async function streamModelPull(
  baseUrl: string,
  modelId: string,
  signal: AbortSignal,
  onProgress: (event: PullEvent) => void,
): Promise<PullResult> {
  const res = await appWretch
    .url(`${baseUrl}/api/pull`)
    .options({ signal: AbortSignal.any([signal, AbortSignal.timeout(PULL_TIMEOUT_MS)]) })
    .post({ name: modelId, stream: true })
    .res()

  if (!res.ok || !res.body) {
    return { message: `Ollama responded with ${res.status}`, type: 'error' }
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.trim()) {
        continue
      }
      try {
        const event = JSON.parse(line) as PullEvent
        if (event.status === 'success') {
          return { type: 'success' }
        }
        if (event.status === 'error' || event.error) {
          return { message: typeof event.error === 'string' ? event.error : 'Pull failed', type: 'error' }
        }
        onProgress(event)
      } catch {
        /* Ignore malformed line */
      }
    }
  }

  return { type: 'ended' }
}
