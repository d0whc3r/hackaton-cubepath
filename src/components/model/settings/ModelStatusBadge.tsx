import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PullState } from './types'

interface ModelStatusBadgeProps {
  modelId: string
  installed: boolean
  pullState: PullState | undefined
  ollamaBaseUrl: string
  onPull: (modelId: string, baseUrl: string) => void
}

export function ModelStatusBadge({ modelId, installed, pullState, ollamaBaseUrl, onPull }: ModelStatusBadgeProps) {
  if (pullState?.status === 'pulling') {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin text-primary" />
        <span className="max-w-[150px] truncate text-[11px] text-muted-foreground">
          {pullState.progress ?? 'Pulling…'}
        </span>
      </div>
    )
  }

  if (installed || pullState?.status === 'done') {
    return (
      <Badge
        variant="outline"
        className="h-auto min-h-5 gap-1 rounded-full border-green-500/40 bg-green-500/10 px-1.5 py-0.5 text-[10px] leading-none text-green-700 dark:text-green-400"
      >
        <CheckCircle2 className="h-2.5 w-2.5" />
        Installed
      </Badge>
    )
  }

  if (pullState?.status === 'error') {
    return (
      <Badge
        variant="outline"
        title={pullState.error ?? 'Error'}
        className="h-auto min-h-5 max-w-[180px] gap-1 overflow-visible rounded-full border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-[10px] leading-none text-destructive"
      >
        <AlertCircle className="h-2.5 w-2.5" />
        <span className="truncate">Error</span>
      </Badge>
    )
  }

  function handlePull() {
    onPull(modelId, ollamaBaseUrl)
  }

  return (
    <button
      type="button"
      onClick={handlePull}
      className="flex h-5 items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-1.5 text-[10px] text-primary transition-colors hover:bg-primary/20"
    >
      <Download className="h-2.5 w-2.5" />
      Pull
    </button>
  )
}
