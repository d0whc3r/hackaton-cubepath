import { captureException, withScope } from '@sentry/browser'
import { AlertTriangle, Home, RotateCcw, Settings2 } from 'lucide-react'
import { Component } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { logClientError } from '@/lib/observability/client'

interface AppErrorBoundaryProps {
  children: React.ReactNode
  boundaryName: string
  context?: Record<string, unknown>
  variant?: 'inline' | 'page'
}

interface AppErrorBoundaryState {
  error: Error | null
}

function BoundaryFallback({
  error,
  onRetry,
  variant,
}: Readonly<{
  error: Error
  onRetry: () => void
  variant: 'inline' | 'page'
}>) {
  if (variant === 'inline') {
    return (
      <Alert variant="destructive" className="my-1">
        <AlertTriangle />
        <AlertTitle>Component unavailable</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-2">
          <span>{error.message || 'Unexpected UI failure.'}</span>
          <Button type="button" size="xs" variant="outline" onClick={onRetry}>
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-2xl border border-border/70 bg-card shadow-sm">
        <CardHeader className="gap-3">
          <Badge variant="destructive" className="w-fit">
            UI Error
          </Badge>
          <CardTitle className="text-2xl tracking-tight">Something went wrong in the interface</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>We captured this error</AlertTitle>
            <AlertDescription>{error.message || 'Unexpected UI failure.'}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2">
          <p className="text-xs text-muted-foreground">The incident has been reported to observability services.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={onRetry}>
              <RotateCcw className="size-4" />
              Retry render
            </Button>
            <Button asChild type="button" variant="outline">
              <a href="/">
                <Home className="size-4" />
                Overview
              </a>
            </Button>
            <Button asChild type="button" variant="secondary">
              <a href="/settings">
                <Settings2 className="size-4" />
                Settings
              </a>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const metadata = {
      boundaryName: this.props.boundaryName,
      componentStack: errorInfo.componentStack,
      ...this.props.context,
    }

    logClientError('ui.error_boundary.captured', error, metadata)
    withScope((scope) => {
      scope.setTag('error_boundary', this.props.boundaryName)
      scope.setContext('react', { componentStack: errorInfo.componentStack })
      if (this.props.context) {
        scope.setContext('boundary', this.props.context)
      }
      captureException(error)
    })
  }

  private readonly handleRetry = () => {
    globalThis.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <BoundaryFallback error={this.state.error} onRetry={this.handleRetry} variant={this.props.variant ?? 'page'} />
      )
    }

    return this.props.children
  }
}
