import { useState } from 'react'
import type { UserMessage } from '@/lib/schemas/route'
import { formatTime } from '@/lib/utils/format'

const TASK_COLORS: Record<string, string> = {
  commit: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  explain: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  refactor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  test: 'bg-green-500/10 text-green-600 dark:text-green-400',
}

const TASK_LABEL: Record<string, string> = {
  commit: 'Commit',
  explain: 'Explain',
  refactor: 'Refactor',
  test: 'Tests',
}

const PREVIEW_LIMIT = 300

interface UserBubbleProps {
  msg: UserMessage
}

export function UserBubble({ msg }: Readonly<UserBubbleProps>) {
  const isLong = msg.content.length > PREVIEW_LIMIT
  const [expanded, setExpanded] = useState(false)
  const displayContent = isLong && !expanded ? `${msg.content.slice(0, PREVIEW_LIMIT)}…` : msg.content

  return (
    <div className="flex justify-end motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-right-3">
      <div className="max-w-[85%] space-y-1">
        <div className="flex items-center justify-end gap-2">
          <time className="text-[10px] text-muted-foreground" dateTime={msg.timestamp.toISOString()}>
            {formatTime(msg.timestamp)}
          </time>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TASK_COLORS[msg.taskType] ?? ''}`}>
            {TASK_LABEL[msg.taskType] ?? msg.taskType}
          </span>
          {msg.fileName && (
            <span className="rounded border border-border/50 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {msg.fileName}
            </span>
          )}
        </div>
        <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 transition-transform hover:translate-x-0.5">
          <pre className="font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-primary-foreground">
            {displayContent}
          </pre>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-1.5 text-[10px] text-primary-foreground/70 underline underline-offset-2 hover:text-primary-foreground"
            >
              {expanded ? 'Show less' : `Show all (${msg.content.length.toLocaleString()} chars)`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
