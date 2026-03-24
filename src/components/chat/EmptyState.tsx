import { Zap } from 'lucide-react'
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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Zap className="h-6 w-6 text-primary" />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="font-semibold text-foreground">Ready to route</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}
