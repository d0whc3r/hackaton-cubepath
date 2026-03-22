import { Loader2, Zap } from 'lucide-react'

import type { AssistantMessage } from '@/lib/schemas/route'

import { RoutingProgress } from '@/components/chat/RoutingProgress'
import { TranslateButton } from '@/components/chat/TranslateButton'
import { CostBadge } from '@/components/cost/CostBadge'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'

interface AssistantBubbleProps {
  readonly msg: AssistantMessage
}

export function AssistantBubble({ msg }: AssistantBubbleProps) {
  const isStreaming = msg.status === 'streaming'

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
          {msg.status === 'interrupted' && !msg.error && (
            <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              Interrupted — partial output below
            </div>
          )}

          {msg.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <p className="font-medium">Error</p>
              <p className="opacity-80">{msg.error}</p>
            </div>
          )}
          {!msg.error && msg.content && <MarkdownRenderer content={msg.content} />}
          {!msg.error && !msg.content && isStreaming && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
            </div>
          )}

          <RoutingProgress steps={msg.routingSteps} specialist={msg.specialist} isStreaming={isStreaming} />

          {msg.cost && (
            <div className="mt-3 border-t border-border/40 pt-3">
              <CostBadge cost={msg.cost} />
            </div>
          )}

          {msg.status === 'done' && msg.content && <TranslateButton content={msg.content} />}
        </div>
      </div>
    </div>
  )
}
