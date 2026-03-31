import { renderHook } from '@testing-library/react'
import { useSubmitShortcut } from '@/hooks/use-submit-shortcut'

function makeKeyEvent(
  overrides: Partial<React.KeyboardEvent<HTMLTextAreaElement>>,
): React.KeyboardEvent<HTMLTextAreaElement> {
  return {
    ctrlKey: false,
    key: 'Enter',
    metaKey: false,
    preventDefault: vi.fn(),
    ...overrides,
  } as unknown as React.KeyboardEvent<HTMLTextAreaElement>
}

describe('useSubmitShortcut', () => {
  it('calls onSubmit and prevents default on Cmd+Enter (metaKey)', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSubmitShortcut(onSubmit))

    const event = makeKeyEvent({ key: 'Enter', metaKey: true })
    result.current(event)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
  })

  it('calls onSubmit and prevents default on Ctrl+Enter (ctrlKey)', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSubmitShortcut(onSubmit))

    const event = makeKeyEvent({ ctrlKey: true, key: 'Enter' })
    result.current(event)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
  })

  it('does not call onSubmit for plain Enter without modifier', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSubmitShortcut(onSubmit))

    const event = makeKeyEvent({ key: 'Enter' })
    result.current(event)

    expect(onSubmit).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('does not call onSubmit for Cmd+K (wrong key)', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSubmitShortcut(onSubmit))

    const event = makeKeyEvent({ key: 'k', metaKey: true })
    result.current(event)

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not call onSubmit for Ctrl+A (wrong key)', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSubmitShortcut(onSubmit))

    const event = makeKeyEvent({ ctrlKey: true, key: 'a' })
    result.current(event)

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('returns a stable callback reference when onSubmit does not change', () => {
    const onSubmit = vi.fn()
    const { result, rerender } = renderHook(() => useSubmitShortcut(onSubmit))

    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('returns a new callback reference when onSubmit changes', () => {
    let onSubmit = vi.fn()
    const { result, rerender } = renderHook(() => useSubmitShortcut(onSubmit))

    const first = result.current
    onSubmit = vi.fn()
    rerender()

    expect(result.current).not.toBe(first)
  })
})
