import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
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
      <TooltipProvider>{children}</TooltipProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
