import { parseSSEStream } from '@/lib/utils/sse'

function createReader(text: string): ReadableStreamDefaultReader<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  }).getReader()
}

function callbacks() {
  return {
    onCost: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
    onInterrupted: vi.fn(),
    onResponseChunk: vi.fn(),
    onRoutingStep: vi.fn(),
    onSpecialistSelected: vi.fn(),
  }
}

describe('parseSSEStream', () => {
  it('ignores malformed SSE payloads and still processes valid events', async () => {
    const cbs = callbacks()
    const reader = createReader(
      [
        'event: response_chunk',
        'data: {"text":"hello"}',
        '',
        'event: response_chunk',
        'data: {"text":',
        '',
        'event: done',
        'data: {}',
        '',
        '',
      ].join('\n'),
    )

    await parseSSEStream(reader, cbs)

    expect(cbs.onResponseChunk).toHaveBeenCalledTimes(1)
    expect(cbs.onResponseChunk).toHaveBeenCalledWith('hello')
    expect(cbs.onDone).toHaveBeenCalled()
  })

  it('processes a final buffered event without a trailing blank line', async () => {
    const cbs = callbacks()
    const reader = createReader(['event: error', 'data: {"message":"boom"}'].join('\n'))

    await parseSSEStream(reader, cbs)

    expect(cbs.onError).toHaveBeenCalledWith({ code: 'UNKNOWN', message: 'boom' })
  })
})
