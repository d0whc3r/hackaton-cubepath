import { streamText } from 'ai'
import { runStream } from '@/lib/api/stream-runner'

vi.mock(import('ai'), async (importOriginal) => ({
  ...(await importOriginal()),
  streamText: vi.fn(),
}))

vi.mock(import('@/lib/observability/metrics'), () => ({
  recordStreamChars: vi.fn(),
  recordStreamDuration: vi.fn(),
}))

vi.mock(import('@/lib/observability/client'), () => ({
  logClient: vi.fn(),
  logClientError: vi.fn(),
}))

function createAsyncIterable(chunks: string[], options?: { onBeforeFirstChunk?: () => Promise<void> | void }) {
  return (async function* asyncInterator() {
    if (options?.onBeforeFirstChunk) {
      await options.onBeforeFirstChunk()
    }
    for (const chunk of chunks) {
      yield chunk
    }
  })()
}

describe('runStream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits cost and done on success', async () => {
    const emit = vi.fn()
    vi.mocked(streamText).mockReturnValue({
      finishReason: Promise.resolve('stop'),
      textStream: createAsyncIterable(['hello ', 'world']),
    } as never)

    await runStream({
      emit,
      input: 'test input',
      modelId: 'test-model',
      ollama: vi.fn(() => 'model-handle') as never,
      systemPrompt: 'system',
    })

    expect(emit).toHaveBeenCalledWith('response_chunk', { text: 'hello ' })
    expect(emit).toHaveBeenCalledWith('response_chunk', { text: 'world' })
    expect(emit).toHaveBeenCalledWith('cost', expect.objectContaining({ inputTokens: expect.any(Number) }))
    expect(emit).toHaveBeenCalledWith('done', {})
  })

  it('emits interrupted when the stream times out and aborts', async () => {
    vi.useFakeTimers()
    const emit = vi.fn()

    vi.mocked(streamText).mockImplementation(({ abortSignal }) => {
      const textStream = (async function* textStream() {
        await new Promise((resolve, reject) => {
          abortSignal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
          })
          setTimeout(resolve, 600_000)
        })
        yield 'never'
      })()

      return {
        finishReason: Promise.resolve('stop'),
        textStream,
      } as never
    })

    const runPromise = runStream({
      emit,
      input: 'test input',
      modelId: 'test-model',
      ollama: vi.fn(() => 'model-handle') as never,
      systemPrompt: 'system',
    })

    await vi.advanceTimersByTimeAsync(300_000)
    await runPromise

    expect(emit).toHaveBeenCalledWith('interrupted', {})
  })

  it('emits error when the model stream throws', async () => {
    const emit = vi.fn()
    vi.mocked(streamText).mockReturnValue({
      finishReason: Promise.resolve('error'),
      // oxlint-disable-next-line require-yield,unicorn/consistent-function-scoping
      textStream: (async function* textStream() {
        throw new Error('Connection refused')
      })(),
    } as never)

    await runStream({
      emit,
      input: 'test input',
      modelId: 'test-model',
      ollama: vi.fn(() => 'model-handle') as never,
      systemPrompt: 'system',
    })

    expect(emit).toHaveBeenCalledWith('error', {
      code: 'OLLAMA_UNREACHABLE',
      message: "Cannot connect to Ollama. Make sure it's running on your machine.",
    })
  })

  it('emits a truncation warning when the continuation also finishes because of length', async () => {
    const emit = vi.fn()
    vi.mocked(streamText)
      .mockReturnValueOnce({
        finishReason: Promise.resolve('length'),
        textStream: createAsyncIterable(['first part']),
      } as never)
      .mockReturnValueOnce({
        finishReason: Promise.resolve('length'),
        textStream: createAsyncIterable([' second part']),
      } as never)

    await runStream({
      autoContinue: true,
      emit,
      input: 'test input',
      modelId: 'test-model',
      ollama: vi.fn(() => 'model-handle') as never,
      systemPrompt: 'system',
    })

    expect(emit).toHaveBeenCalledWith('routing_step', {
      detail: 'Response was truncated after the continuation. Try a shorter input.',
      label: 'Response truncated',
      status: 'error',
      step: 'generating_response',
    })
  })
})
