import { appWretch } from '@/lib/http/app-client'

export const PULL_TIMEOUT_MS = 600_000

export interface PullEvent {
  completed?: number
  error?: string
  status?: string
  total?: number
}

export type PullResult = { type: 'success' } | { message: string; type: 'error' } | { type: 'ended' }

function createPullSignal(signal: AbortSignal): AbortSignal {
  return AbortSignal.any([signal, AbortSignal.timeout(PULL_TIMEOUT_MS)])
}

async function requestPullStream(baseUrl: string, modelId: string, signal: AbortSignal): Promise<Response> {
  return appWretch
    .url(`${baseUrl}/api/pull`)
    .options({ signal: createPullSignal(signal) })
    .post({ name: modelId, stream: true })
    .res()
}

function getImmediatePullResult(res: Response): PullResult | undefined {
  if (res.ok && res.body) {
    return undefined
  }
  return { message: `Ollama responded with ${res.status}`, type: 'error' }
}

function parsePullEventLine(line: string): PullEvent | undefined {
  if (!line.trim()) {
    return undefined
  }
  try {
    return JSON.parse(line) as PullEvent
  } catch {
    return undefined
  }
}

function toTerminalResult(event: PullEvent): PullResult | undefined {
  if (event.status === 'success') {
    return { type: 'success' }
  }
  if (event.status === 'error' || event.error) {
    return { message: typeof event.error === 'string' ? event.error : 'Pull failed', type: 'error' }
  }
  return undefined
}

function processPullEventLine(line: string, onProgress: (event: PullEvent) => void): PullResult | undefined {
  const event = parsePullEventLine(line)
  if (!event) {
    return undefined
  }
  const result = toTerminalResult(event)
  if (result) {
    return result
  }
  onProgress(event)
  return undefined
}

function decodeChunkLines(decoder: TextDecoder, chunk: Uint8Array, carry: string): { carry: string; lines: string[] } {
  const merged = carry + decoder.decode(chunk, { stream: true })
  const lines = merged.split('\n')
  return { carry: lines.pop() ?? '', lines }
}

async function consumePullResponseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onProgress: (event: PullEvent) => void,
): Promise<PullResult> {
  const decoder = new TextDecoder()
  let carry = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    const { carry: nextCarry, lines } = decodeChunkLines(decoder, value, carry)
    carry = nextCarry
    for (const line of lines) {
      const result = processPullEventLine(line, onProgress)
      if (result) {
        return result
      }
    }
  }

  const lastLineResult = processPullEventLine(carry, onProgress)
  if (lastLineResult) {
    return lastLineResult
  }

  return { type: 'ended' }
}

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
  const res = await requestPullStream(baseUrl, modelId, signal)
  const immediate = getImmediatePullResult(res)
  if (immediate) {
    return immediate
  }
  if (!res.body) {
    return { message: `Ollama responded with ${res.status}`, type: 'error' }
  }
  return consumePullResponseStream(res.body.getReader(), onProgress)
}
