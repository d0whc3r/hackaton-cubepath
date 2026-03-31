import { http, HttpResponse } from 'msw'
import { server } from '@/__tests__/msw/server'
import { streamModelPull } from '@/lib/ollama/pull-stream'

const BASE_URL = 'http://localhost:11434'

function makeNdjsonStream(...lines: string[]): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      for (const line of lines) {
        controller.enqueue(enc.encode(`${line}\n`))
      }
      controller.close()
    },
  })
}

describe('streamModelPull', () => {
  it('returns { type: "success" } on a successful pull stream', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/pull`,
        () =>
          new HttpResponse(makeNdjsonStream('{"status":"pulling manifest"}', '{"status":"success"}'), {
            headers: { 'Content-Type': 'application/x-ndjson' },
          }),
      ),
    )

    const onProgress = vi.fn()
    const result = await streamModelPull(BASE_URL, 'llama3.2', AbortSignal.timeout(5000), onProgress)

    expect(result).toEqual({ type: 'success' })
  })

  it('calls onProgress for intermediate events', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/pull`,
        () =>
          new HttpResponse(
            makeNdjsonStream(
              '{"status":"pulling manifest"}',
              '{"status":"downloading","completed":50,"total":100}',
              '{"status":"success"}',
            ),
            { headers: { 'Content-Type': 'application/x-ndjson' } },
          ),
      ),
    )

    const onProgress = vi.fn()
    await streamModelPull(BASE_URL, 'llama3.2', AbortSignal.timeout(5000), onProgress)

    expect(onProgress).toHaveBeenCalledTimes(2)
    expect(onProgress).toHaveBeenNthCalledWith(1, { status: 'pulling manifest' })
    expect(onProgress).toHaveBeenNthCalledWith(2, { completed: 50, status: 'downloading', total: 100 })
  })

  it('returns { type: "error" } when stream contains an error event', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/pull`,
        () =>
          new HttpResponse(makeNdjsonStream('{"status":"error","error":"model not found"}'), {
            headers: { 'Content-Type': 'application/x-ndjson' },
          }),
      ),
    )

    const result = await streamModelPull(BASE_URL, 'bad-model', AbortSignal.timeout(5000), vi.fn())

    expect(result).toEqual({ message: 'model not found', type: 'error' })
  })

  it('throws for non-ok HTTP responses (wretch raises before returning Response)', async () => {
    server.use(http.post(`${BASE_URL}/api/pull`, () => new HttpResponse(null, { status: 404 })))

    await expect(streamModelPull(BASE_URL, 'model', AbortSignal.timeout(5000), vi.fn())).rejects.toThrow()
  })

  it('returns { type: "ended" } when stream ends without a terminal status event', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/pull`,
        () =>
          new HttpResponse(makeNdjsonStream('{"status":"pulling manifest"}'), {
            headers: { 'Content-Type': 'application/x-ndjson' },
          }),
      ),
    )

    const result = await streamModelPull(BASE_URL, 'model', AbortSignal.timeout(5000), vi.fn())

    expect(result).toEqual({ type: 'ended' })
  })

  it('returns { type: "error" } when event has an error field but status is not "error"', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/pull`,
        () =>
          new HttpResponse(makeNdjsonStream('{"error":"something went wrong"}'), {
            headers: { 'Content-Type': 'application/x-ndjson' },
          }),
      ),
    )

    const result = await streamModelPull(BASE_URL, 'model', AbortSignal.timeout(5000), vi.fn())

    expect(result).toEqual({ message: 'something went wrong', type: 'error' })
  })

  it('skips blank lines in the stream without crashing', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/pull`,
        () =>
          new HttpResponse(makeNdjsonStream('', '   ', '{"status":"success"}'), {
            headers: { 'Content-Type': 'application/x-ndjson' },
          }),
      ),
    )

    const onProgress = vi.fn()
    const result = await streamModelPull(BASE_URL, 'model', AbortSignal.timeout(5000), onProgress)

    expect(result).toEqual({ type: 'success' })
    expect(onProgress).not.toHaveBeenCalled()
  })

  it('skips malformed JSON lines without crashing', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/pull`,
        () =>
          new HttpResponse(makeNdjsonStream('not-json{{', '{"status":"success"}'), {
            headers: { 'Content-Type': 'application/x-ndjson' },
          }),
      ),
    )

    const result = await streamModelPull(BASE_URL, 'model', AbortSignal.timeout(5000), vi.fn())

    expect(result).toEqual({ type: 'success' })
  })
})
