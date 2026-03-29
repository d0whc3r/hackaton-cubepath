import { Zap } from 'lucide-react'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useChatContext } from '@/lib/context/chat-context'

const TASK_HINTS: Record<string, string> = {
  commit: 'Paste a git diff or describe your changes to get a commit message.',
  explain: 'Paste any code snippet and get a structured explanation with examples.',
  refactor: 'Paste code and get improved structure while preserving behavior.',
  test: 'Paste a function or class and get a test suite with edge cases.',
}

export function EmptyState() {
  const { activeTask } = useChatContext()
  const hint = TASK_HINTS[activeTask] ?? 'Paste code below and the router will pick the right specialist model.'

  return (
    <Empty className="min-h-0 flex-1 border-none p-8">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="h-14 w-14 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Zap className="h-6 w-6 text-primary" />
        </EmptyMedia>
        <EmptyTitle>Ready to route</EmptyTitle>
        <EmptyDescription>{hint}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap justify-center gap-2">
          <a
            href="/tasks/explain"
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            Explain
          </a>
          <a
            href="/tasks/test"
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            Tests
          </a>
          <a
            href="/tasks/refactor"
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            Refactor
          </a>
          <a
            href="/tasks/commit"
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            Commit
          </a>
        </div>
      </EmptyContent>
    </Empty>
  )
}
