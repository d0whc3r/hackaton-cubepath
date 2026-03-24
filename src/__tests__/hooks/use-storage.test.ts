import { act, renderHook } from '@testing-library/react'
import { useStorage } from '@/hooks/use-storage'

describe('useStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes value to defaultValue before hydration', () => {
    const { result } = renderHook(() => useStorage<string>('key', { defaultValue: 'init' }))
    // On first render (before useEffect), value is defaultValue
    expect(result.current.value).toBe('init')
  })

  it('reads stored value after hydration', async () => {
    localStorage.setItem('key', JSON.stringify('stored'))
    const { result } = renderHook(() => useStorage<string>('key'))
    await act(async () => {})
    expect(result.current.value).toBe('stored')
  })

  it('set updates state and persists to storage', async () => {
    const { result } = renderHook(() => useStorage<number>('num'))
    await act(async () => {
      result.current.set(7)
    })
    expect(result.current.value).toBe(7)
    expect(JSON.parse(localStorage.getItem('num') ?? 'null')).toBe(7)
  })

  it('remove resets value to defaultValue and removes from storage', async () => {
    localStorage.setItem('key', JSON.stringify('hello'))
    const { result } = renderHook(() => useStorage<string>('key', { defaultValue: 'default' }))
    await act(async () => {})
    expect(result.current.value).toBe('hello')
    await act(async () => {
      result.current.remove()
    })
    expect(result.current.value).toBe('default')
    expect(localStorage.getItem('key')).toBeNull()
  })

  it('populates error on read failure', async () => {
    localStorage.setItem('bad', 'not-json{{')
    const { result } = renderHook(() => useStorage('bad'))
    await act(async () => {})
    expect(result.current.error).not.toBeNull()
    expect(result.current.value).toBeNull()
  })

  it('populates error on write failure', async () => {
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError')
    })
    const { result } = renderHook(() => useStorage<string>('key'))
    await act(async () => {
      result.current.set('value')
    })
    expect(result.current.error).not.toBeNull()
  })

  it('updates value on cross-tab storage event', async () => {
    const { result } = renderHook(() => useStorage<string>('tab-key'))
    await act(async () => {})
    await act(async () => {
      globalThis.dispatchEvent(
        new StorageEvent('storage', {
          key: 'tab-key',
          newValue: JSON.stringify('from-other-tab'),
        }),
      )
    })
    expect(result.current.value).toBe('from-other-tab')
  })

  it('resets value to default on cross-tab removal (newValue null)', async () => {
    localStorage.setItem('tab-key', JSON.stringify('old'))
    const { result } = renderHook(() => useStorage<string>('tab-key', { defaultValue: 'fallback' }))
    await act(async () => {})
    await act(async () => {
      globalThis.dispatchEvent(new StorageEvent('storage', { key: 'tab-key', newValue: null }))
    })
    expect(result.current.value).toBe('fallback')
  })

  it('removes storage event listener on unmount', () => {
    const addSpy = vi.spyOn(globalThis, 'addEventListener')
    const removeSpy = vi.spyOn(globalThis, 'removeEventListener')
    const { unmount } = renderHook(() => useStorage('key'))
    unmount()
    const storageAdds = addSpy.mock.calls.filter(([type]) => type === 'storage').length
    const storageRemoves = removeSpy.mock.calls.filter(([type]) => type === 'storage').length
    expect(storageRemoves).toBeGreaterThanOrEqual(storageAdds)
  })
})
