import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useGuardBootstrap } from '@/hooks/use-guard-bootstrap'
import { logClientError } from '@/lib/observability/client'

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: 0 },
    queries: { retry: 1, staleTime: 30_000 },
  },
})

interface AppProvidersProps {
  children: React.ReactNode
}

let hasGuardReadySession = false

function InitializingScreen({
  error,
  modelId,
  progress,
  status,
  onRetry,
}: {
  error?: string
  modelId: string
  progress?: string
  status: 'checking' | 'pulling' | 'ready' | 'error'
  onRetry: () => void
}) {
  const subtitle =
    status === 'checking'
      ? `Checking security model availability (${modelId})`
      : `Downloading security model (${modelId})${progress ? ` · ${progress}` : ''}`

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-xl rounded-xl border border-border/70 bg-card p-6 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-base font-semibold text-foreground">Initializing system</p>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        {status === 'error' && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-destructive">{error ?? 'Initialization failed.'}</p>
            <div className="flex justify-center gap-2">
              <Button onClick={onRetry} type="button" variant="outline">
                Retry
              </Button>
              <Button asChild type="button" variant="secondary">
                <a href="/settings">Go to Settings</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function GuardGate({ children }: { children: React.ReactNode }) {
  const { retry, state } = useGuardBootstrap()
  const [canBypassBlockingInit, setCanBypassBlockingInit] = useState(hasGuardReadySession)

  // Exclude routes that don't need guard model checking (like /settings and root /)
  const pathname = globalThis.location?.pathname || ''
  const isExcludedPage = pathname === '/settings' || pathname === '/'

  useEffect(() => {
    if (state.status === 'ready') {
      hasGuardReadySession = true
      setCanBypassBlockingInit(true)
    }
  }, [state.status])

  if (!canBypassBlockingInit && state.status !== 'ready' && !isExcludedPage) {
    return (
      <InitializingScreen
        error={state.error}
        modelId={state.modelId}
        onRetry={retry}
        progress={state.progress}
        status={state.status}
      />
    )
  }

  // oxlint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      logClientError('ui.window.error', event.error ?? event.message, {
        filename: event.filename,
        lineno: event.lineno,
      })
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      logClientError('ui.window.unhandled_rejection', event.reason)
    }

    globalThis.addEventListener('error', onError)
    globalThis.addEventListener('unhandledrejection', onRejection)

    return () => {
      globalThis.removeEventListener('error', onError)
      globalThis.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GuardGate>{children}</GuardGate>
      </TooltipProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
