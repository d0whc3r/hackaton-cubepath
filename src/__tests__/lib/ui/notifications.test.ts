import { toast } from 'sonner'
import { copyNotificationDetails, notify } from '@/lib/ui/notifications'

describe('notify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(toast, 'error').mockImplementation(() => '')
    vi.spyOn(toast, 'info').mockImplementation(() => '')
    vi.spyOn(toast, 'success').mockImplementation(() => '')
    vi.spyOn(toast, 'warning').mockImplementation(() => '')
  })

  it('applies default options for info notifications', () => {
    notify.info('Heads up')

    expect(toast.info).toHaveBeenCalledWith(
      'Heads up',
      expect.objectContaining({
        closeButton: true,
        duration: 5000,
      }),
    )
  })

  it('uses error duration and normalizes null description to undefined', () => {
    notify.error('Failure', { description: null })

    expect(toast.error).toHaveBeenCalledWith(
      'Failure',
      expect.objectContaining({
        closeButton: true,
        description: undefined,
        duration: 7000,
      }),
    )
  })
})

describe('copyNotificationDetails', () => {
  const originalNavigator = globalThis.navigator

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
      writable: true,
    })
  })

  it('copies text and emits success notification', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { clipboard: { writeText } },
      writable: true,
    })

    await copyNotificationDetails('blocked details', 'Copied')

    expect(writeText).toHaveBeenCalledWith('blocked details')
    expect(toast.success).toHaveBeenCalledWith(
      'Copied',
      expect.objectContaining({
        closeButton: true,
        duration: 5000,
      }),
    )
  })

  it('emits error notification when clipboard write fails', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('denied')))
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { clipboard: { writeText } },
      writable: true,
    })

    await copyNotificationDetails('blocked details')

    expect(toast.error).toHaveBeenCalledWith(
      'Unable to copy details',
      expect.objectContaining({
        closeButton: true,
        duration: 7000,
      }),
    )
  })

  it('returns early when text is empty', async () => {
    const writeText = vi.fn()
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { clipboard: { writeText } },
      writable: true,
    })

    await copyNotificationDetails('')

    expect(writeText).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })
})
