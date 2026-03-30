import { captureException } from '@sentry/browser'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { logClientError } from '@/lib/observability/client'

// oxlint-disable-next-line prefer-import-in-mock
vi.mock('@sentry/browser', async (importOriginal) => ({
  ...(await importOriginal()),
  captureException: vi.fn(),
  withScope: vi.fn((callback: (scope: { setTag: typeof vi.fn; setContext: typeof vi.fn }) => unknown) =>
    callback({ setContext: vi.fn(), setTag: vi.fn() }),
  ),
}))

vi.mock(import('@/lib/observability/client'), async (importOriginal) => ({
  ...(await importOriginal()),
  logClientError: vi.fn(),
}))

function Thrower(): never {
  throw new Error('boom from render')
}

describe('AppErrorBoundary', () => {
  it('captures render errors with logger and sentry', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <AppErrorBoundary boundaryName="test.boundary" variant="inline">
        <Thrower />
      </AppErrorBoundary>,
    )

    expect(screen.getByText('Component unavailable')).toBeDefined()
    expect(logClientError).toHaveBeenCalledWith(
      'ui.error_boundary.captured',
      expect.any(Error),
      expect.objectContaining({ boundaryName: 'test.boundary' }),
    )
    expect(captureException).toHaveBeenCalledWith(expect.any(Error))
    consoleErrorSpy.mockRestore()
  })

  it('reloads the page when retry is clicked', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const reloadSpy = vi.spyOn(globalThis.location, 'reload').mockImplementation(() => {})

    render(
      <AppErrorBoundary boundaryName="test.retry" variant="inline">
        <Thrower />
      </AppErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })
})
