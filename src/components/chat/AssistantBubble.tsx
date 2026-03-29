import { AlertCircle, Loader2, ShieldAlert, StopCircle, Zap } from 'lucide-react'
import type { AssistantMessage } from '@/lib/schemas/route'
import { RoutingProgress } from '@/components/chat/RoutingProgress'
import { TranslateButton } from '@/components/chat/TranslateButton'
import { CostBadge } from '@/components/cost/CostBadge'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface AssistantBubbleProps {
  msg: AssistantMessage
}

const ERROR_TITLES: Record<string, string> = {
  MODEL_NOT_FOUND: 'Model not installed',
  OLLAMA_ERROR: 'Ollama error',
  OLLAMA_UNREACHABLE: 'Ollama unreachable',
  SPECIALIST_UNAVAILABLE: 'Model unavailable',
}

const ERROR_HINTS: Record<string, string> = {
  OLLAMA_UNREACHABLE: 'ollama serve',
}

function getErrorTitle(code: string | null | undefined): string {
  return (code && ERROR_TITLES[code]) ?? 'Generation error'
}

function getErrorHint(code: string | null | undefined): string | null {
  return (code && ERROR_HINTS[code]) ?? null
}

export function AssistantBubble({ msg }: AssistantBubbleProps) {
  const isStreaming = msg.status === 'streaming'

  if (msg.status === 'blocked') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] min-w-0">
          <Alert className="rounded-2xl rounded-tl-sm border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/25 dark:text-orange-300">
            <ShieldAlert className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            <AlertTitle>Request blocked</AlertTitle>
            <AlertDescription className="text-orange-600/90 dark:text-orange-400/80">
              {msg.blockReason}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] min-w-0 space-y-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-3 w-3 text-primary" />
          </div>
          {msg.specialist && (
            <span className="text-[11px] font-medium text-foreground">{msg.specialist.displayName}</span>
          )}
          {isStreaming && !msg.specialist && (
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              Routing…
            </span>
          )}
        </div>

        <div className="rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3 shadow-sm">
          {msg.error && (
            <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{getErrorTitle(msg.errorCode)}</AlertTitle>
              <AlertDescription>
                <span>{msg.error}</span>
                {getErrorHint(msg.errorCode) && (
                  <span className="mt-1 block text-[10px] text-destructive/60">
                    Run: <code className="font-mono">{getErrorHint(msg.errorCode)}</code>
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
          {!msg.error && msg.content && <MarkdownRenderer content={msg.content} />}

          {msg.status === 'interrupted' && msg.content && (
            <div className="mt-3 flex items-center gap-1.5 border-t border-dashed border-border/50 pt-2.5">
              <StopCircle className="h-3 w-3 shrink-0 text-muted-foreground/50" />
              <span className="text-[11px] text-muted-foreground/50">Response stopped here</span>
            </div>
          )}

          {msg.status === 'interrupted' && !msg.content && !msg.error && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <StopCircle className="h-3.5 w-3.5 shrink-0" />
              Response stopped before generating
            </div>
          )}

          {!msg.error && !msg.content && isStreaming && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
            </div>
          )}

          <RoutingProgress steps={msg.routingSteps} specialist={msg.specialist} isStreaming={isStreaming} />

          {msg.cost && (
            <div className="mt-3">
              <CostBadge cost={msg.cost} />
            </div>
          )}

          {msg.status === 'done' && msg.content && <TranslateButton content={msg.content} />}
        </div>
      </div>
    </div>
  )
}
