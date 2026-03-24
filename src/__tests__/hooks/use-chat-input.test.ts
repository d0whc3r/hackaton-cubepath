import { renderHook, act } from '@testing-library/react'
import { useChatInput } from '@/hooks/use-chat-input'
import { useChatContext } from '@/lib/context/chat-context'

vi.mock(import('@/lib/context/chat-context'), () => ({
  useChatContext: vi.fn(() => ({
    activeTask: 'explain',
    currentModel: 'qwen2.5-coder:1.5b',
    entries: [],
    fixedTaskType: undefined,
    handleCancel: vi.fn(),
    handleClearHistory: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
    setActiveTask: vi.fn(),
  })),
}))

const MAX_CHARS = 15_000

describe('useChatInput', () => {
  it('overLimit is false when input <= 15000 chars', () => {
    const setInput = vi.fn()
    const { result } = renderHook(() => useChatInput('hello', setInput))
    expect(result.current.overLimit).toBe(false)
  })

  it('overLimit is true when input > 15000 chars', () => {
    const setInput = vi.fn()
    const longInput = 'a'.repeat(MAX_CHARS + 1)
    const { result } = renderHook(() => useChatInput(longInput, setInput))
    expect(result.current.overLimit).toBe(true)
  })

  it('charCount reflects input length', () => {
    const setInput = vi.fn()
    const { result } = renderHook(() => useChatInput('hello', setInput))
    expect(result.current.charCount).toBe(5)
  })

  it('onSubmit is no-op when input is empty', () => {
    const setInput = vi.fn()
    const handleSubmit = vi.fn()
    vi.mocked(useChatContext).mockReturnValue({
      activeTask: 'explain',
      currentModel: 'model',
      entries: [],
      fixedTaskType: undefined,
      handleCancel: vi.fn(),
      handleClearHistory: vi.fn(),
      handleSubmit,
      isLoading: false,
      setActiveTask: vi.fn(),
    })

    const { result } = renderHook(() => useChatInput('   ', setInput))
    act(() => {
      result.current.onSubmit()
    })
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('onSubmit is no-op when overLimit', () => {
    const setInput = vi.fn()
    const handleSubmit = vi.fn()
    vi.mocked(useChatContext).mockReturnValue({
      activeTask: 'explain',
      currentModel: 'model',
      entries: [],
      fixedTaskType: undefined,
      handleCancel: vi.fn(),
      handleClearHistory: vi.fn(),
      handleSubmit,
      isLoading: false,
      setActiveTask: vi.fn(),
    })

    const longInput = 'a'.repeat(MAX_CHARS + 1)
    const { result } = renderHook(() => useChatInput(longInput, setInput))
    act(() => {
      result.current.onSubmit()
    })
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('onSubmit is no-op when isLoading', () => {
    const setInput = vi.fn()
    const handleSubmit = vi.fn()
    vi.mocked(useChatContext).mockReturnValue({
      activeTask: 'explain',
      currentModel: 'model',
      entries: [],
      fixedTaskType: undefined,
      handleCancel: vi.fn(),
      handleClearHistory: vi.fn(),
      handleSubmit,
      isLoading: true,
      setActiveTask: vi.fn(),
    })

    const { result } = renderHook(() => useChatInput('some code', setInput))
    act(() => {
      result.current.onSubmit()
    })
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('onKeyDown triggers submit on Cmd+Enter', () => {
    const setInput = vi.fn()
    const handleSubmit = vi.fn()
    vi.mocked(useChatContext).mockReturnValue({
      activeTask: 'explain',
      currentModel: 'model',
      entries: [],
      fixedTaskType: undefined,
      handleCancel: vi.fn(),
      handleClearHistory: vi.fn(),
      handleSubmit,
      isLoading: false,
      setActiveTask: vi.fn(),
    })

    const { result } = renderHook(() => useChatInput('const x = 1', setInput))
    const preventDefault = vi.fn()
    act(() => {
      result.current.onKeyDown({
        ctrlKey: false,
        key: 'Enter',
        metaKey: true,
        preventDefault,
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>)
    })
    expect(handleSubmit).toHaveBeenCalled()
    expect(preventDefault).toHaveBeenCalled()
  })

  it('onKeyDown triggers submit on Ctrl+Enter', () => {
    const setInput = vi.fn()
    const handleSubmit = vi.fn()
    vi.mocked(useChatContext).mockReturnValue({
      activeTask: 'explain',
      currentModel: 'model',
      entries: [],
      fixedTaskType: undefined,
      handleCancel: vi.fn(),
      handleClearHistory: vi.fn(),
      handleSubmit,
      isLoading: false,
      setActiveTask: vi.fn(),
    })

    const { result } = renderHook(() => useChatInput('const x = 1', setInput))
    const preventDefault = vi.fn()
    act(() => {
      result.current.onKeyDown({
        ctrlKey: true,
        key: 'Enter',
        metaKey: false,
        preventDefault,
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>)
    })
    expect(handleSubmit).toHaveBeenCalled()
  })

  it('onKeyDown does not trigger on plain Enter', () => {
    const setInput = vi.fn()
    const handleSubmit = vi.fn()
    vi.mocked(useChatContext).mockReturnValue({
      activeTask: 'explain',
      currentModel: 'model',
      entries: [],
      fixedTaskType: undefined,
      handleCancel: vi.fn(),
      handleClearHistory: vi.fn(),
      handleSubmit,
      isLoading: false,
      setActiveTask: vi.fn(),
    })

    const { result } = renderHook(() => useChatInput('const x = 1', setInput))
    const preventDefault = vi.fn()
    act(() => {
      result.current.onKeyDown({
        ctrlKey: false,
        key: 'Enter',
        metaKey: false,
        preventDefault,
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>)
    })
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('modelLabel falls back to raw currentModel when no label found', () => {
    const setInput = vi.fn()
    vi.mocked(useChatContext).mockReturnValue({
      activeTask: 'explain',
      currentModel: 'some-unknown-model:latest',
      entries: [],
      fixedTaskType: undefined,
      handleCancel: vi.fn(),
      handleClearHistory: vi.fn(),
      handleSubmit: vi.fn(),
      isLoading: false,
      setActiveTask: vi.fn(),
    })

    const { result } = renderHook(() => useChatInput('', setInput))
    expect(result.current.modelLabel).toBe('some-unknown-model:latest')
  })
})
