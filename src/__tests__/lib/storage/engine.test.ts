import { getStorageEngine } from '@/lib/storage/engine'
// oxlint-disable-next-line import/no-namespace
import * as storageIdbModule from '@/lib/storage/idb'

describe('getStorageEngine', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('uses the IndexedDB engine when IndexedDB is available', async () => {
    vi.spyOn(storageIdbModule, 'isIndexedDBAvailable').mockReturnValue(true)
    const setSpy = vi.spyOn(storageIdbModule, 'idbSet').mockResolvedValue()
    const getSpy = vi.spyOn(storageIdbModule, 'idbGet').mockResolvedValue({ ok: true })
    const removeSpy = vi.spyOn(storageIdbModule, 'idbRemove').mockResolvedValue()
    const engine = getStorageEngine('history')

    await engine.write('k', { ok: true })
    await expect(engine.read('k')).resolves.toEqual({ ok: true })
    await engine.remove('k')

    expect(setSpy).toHaveBeenCalledWith('k', { ok: true })
    expect(getSpy).toHaveBeenCalledWith('k')
    expect(removeSpy).toHaveBeenCalledWith('k')
  })

  it('falls back to localStorage when IndexedDB is unavailable', async () => {
    vi.spyOn(storageIdbModule, 'isIndexedDBAvailable').mockReturnValue(false)
    const getSpy = vi.spyOn(storageIdbModule, 'idbGet')
    const engine = getStorageEngine('history')

    await engine.write('k', { ok: true })
    await expect(engine.read('k')).resolves.toEqual({ ok: true })
    await engine.remove('k')

    expect(localStorage.getItem('k')).toBeNull()
    expect(getSpy).not.toHaveBeenCalled()
  })

  it('always uses localStorage for config storage', async () => {
    vi.spyOn(storageIdbModule, 'isIndexedDBAvailable').mockReturnValue(true)
    const setSpy = vi.spyOn(storageIdbModule, 'idbSet')
    const engine = getStorageEngine('config')

    await engine.write('cfg', { theme: 'light' })
    await expect(engine.read('cfg')).resolves.toEqual({ theme: 'light' })

    expect(setSpy).not.toHaveBeenCalled()
    expect(localStorage.getItem('cfg')).toBe(JSON.stringify({ theme: 'light' }))
  })
})
