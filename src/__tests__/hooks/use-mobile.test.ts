import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/hooks/use-mobile'

const MOBILE_BREAKPOINT = 768

function setupMatchMedia(innerWidth: number) {
  Object.defineProperty(globalThis, 'innerWidth', { configurable: true, value: innerWidth, writable: true })

  const listeners: (() => void)[] = []
  const mql = {
    addEventListener: vi.fn((_: string, cb: () => void) => listeners.push(cb)),
    matches: innerWidth < MOBILE_BREAKPOINT,
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  )

  return { listeners, mql }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useIsMobile', () => {
  it('returns false when viewport is above mobile breakpoint', () => {
    setupMatchMedia(1024)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns true when viewport is below mobile breakpoint', () => {
    setupMatchMedia(375)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false exactly at the breakpoint (768 is not mobile)', () => {
    setupMatchMedia(768)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns true for innerWidth = 767 (one below breakpoint)', () => {
    setupMatchMedia(767)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('updates value when matchMedia change event fires', () => {
    const { listeners } = setupMatchMedia(1024)
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    act(() => {
      Object.defineProperty(globalThis, 'innerWidth', { configurable: true, value: 375, writable: true })
      listeners.forEach((fn) => fn())
    })

    expect(result.current).toBe(true)
  })

  it('attaches and removes the matchMedia change listener on mount/unmount', () => {
    const { mql } = setupMatchMedia(1024)
    const { unmount } = renderHook(() => useIsMobile())

    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    unmount()

    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
