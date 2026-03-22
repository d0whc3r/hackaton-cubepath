import { readStorage, removeStorage, writeStorage } from '@/lib/utils/storage'

// Happy-dom provides a real localStorage; we use spyOn to simulate errors.
// Note: use mockImplementationOnce so mocks self-clean without relying on
// Vi.restoreAllMocks() cross-describe-block ordering on Proxy objects.

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('readStorage', () => {
  it('returns { ok: true, value } for a valid JSON value', () => {
    localStorage.setItem('key', JSON.stringify({ x: 1 }))
    const result = readStorage<{ x: number }>('key')
    expect(result).toEqual({ ok: true, value: { x: 1 } })
  })

  it('returns { ok: true, value: defaultValue } when key is absent and defaultValue provided', () => {
    const result = readStorage<number>('missing', { defaultValue: 42 })
    expect(result).toEqual({ ok: true, value: 42 })
  })

  it('returns { ok: true, value: null } when key is absent and no defaultValue', () => {
    const result = readStorage<number>('missing')
    expect(result).toEqual({ ok: true, value: null })
  })

  it('returns { ok: false } for malformed JSON', () => {
    localStorage.setItem('bad', 'not-json{{')
    const result = readStorage('bad')
    expect(result.ok).toBeFalsy()
  })

  it('returns { ok: true, value: defaultValue } on SSR (window undefined)', () => {
    const origWindow = globalThis.window
    // @ts-expect-error simulate SSR
    delete globalThis.window
    try {
      const result = readStorage<string>('theme', { defaultValue: 'light' })
      expect(result).toEqual({ ok: true, value: 'light' })
    } finally {
      globalThis.window = origWindow
    }
  })

  it('reads from sessionStorage when storage option is "session"', () => {
    sessionStorage.setItem('skey', JSON.stringify('session-value'))
    const result = readStorage<string>('skey', { storage: 'session' })
    expect(result).toEqual({ ok: true, value: 'session-value' })
  })

  it('captures SecurityError from getItem', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('SecurityError')
    })
    const result = readStorage('key')
    expect(result.ok).toBeFalsy()
  })
})

describe('writeStorage', () => {
  it('persists a value and returns { ok: true }', () => {
    const result = writeStorage('wkey', { a: 1 })
    expect(result).toEqual({ ok: true, value: undefined })
    expect(JSON.parse(localStorage.getItem('wkey') ?? 'null')).toEqual({ a: 1 })
  })

  it('returns { ok: false } on SSR (window undefined)', () => {
    const origWindow = globalThis.window
    // @ts-expect-error simulate SSR
    delete globalThis.window
    try {
      const result = writeStorage('key', 'value')
      expect(result.ok).toBeFalsy()
    } finally {
      globalThis.window = origWindow
    }
  })

  it('captures QuotaExceededError and returns { ok: false }', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError')
    })
    const result = writeStorage('key', 'val')
    expect(result.ok).toBeFalsy()
  })

  it('captures non-serializable value error', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    const result = writeStorage('key', circular)
    expect(result.ok).toBeFalsy()
  })
})

describe('removeStorage', () => {
  it('removes an existing key and returns { ok: true }', () => {
    localStorage.setItem('rkey', 'val')
    const result = removeStorage('rkey')
    expect(result).toEqual({ ok: true, value: undefined })
    expect(localStorage.getItem('rkey')).toBeNull()
  })

  it('succeeds on absent key (no throw)', () => {
    const result = removeStorage('non-existent')
    expect(result).toEqual({ ok: true, value: undefined })
  })

  it('returns { ok: false } on SSR (window undefined)', () => {
    const origWindow = globalThis.window
    // @ts-expect-error simulate SSR
    delete globalThis.window
    try {
      const result = removeStorage('key')
      expect(result.ok).toBeFalsy()
    } finally {
      globalThis.window = origWindow
    }
  })

  it('captures error during removeItem', () => {
    vi.spyOn(localStorage, 'removeItem').mockImplementationOnce(() => {
      throw new DOMException('SecurityError')
    })
    const result = removeStorage('key')
    expect(result.ok).toBeFalsy()
  })
})
