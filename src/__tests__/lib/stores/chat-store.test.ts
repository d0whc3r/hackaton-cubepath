import { waitFor } from '@testing-library/react'
import { ensureLoaded, getSnapshot } from '@/lib/stores/chat-store'
import { loadHistoryAsync } from '@/lib/utils/history'

vi.mock(import('@/lib/utils/history'), () => ({
  clearHistoryAsync: vi.fn(() => Promise.resolve()),
  loadHistoryAsync: vi.fn(() => Promise.resolve([])),
  saveHistoryAsync: vi.fn(() => Promise.resolve()),
}))

describe('chat-store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks a task as loaded even when async history loading fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(loadHistoryAsync).mockRejectedValueOnce(new Error('IDB unavailable'))

    ensureLoaded('explain')
    await waitFor(() => {
      expect(getSnapshot().loaded.explain).toBe(true)
    })

    const snapshot = getSnapshot()
    expect(snapshot.loaded.explain).toBe(true)
    expect(snapshot.entries.explain).toEqual([])
    expect(errorSpy).toHaveBeenCalledWith('[chat-store] Failed to load history for task:', 'explain', expect.any(Error))
  })
})
