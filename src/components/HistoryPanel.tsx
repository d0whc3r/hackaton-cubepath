import { useState } from 'react'
import type { TaskType } from '../lib/router/types'

export interface HistoryItem {
  id: string
  input: string
  taskType: TaskType
}

interface HistoryPanelProps {
  history: HistoryItem[]
  onReuse: (input: string, taskType: TaskType) => void
}

const PAGE_SIZE = 10

export function HistoryPanel({ history, onReuse }: Readonly<HistoryPanelProps>) {
  const [visible, setVisible] = useState(PAGE_SIZE)

  if (history.length === 0) {
    return null
  }

  const items = history.slice(0, visible)
  const hasMore = history.length > visible

  return (
    <div>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 py-1">
          <span className="flex-1 truncate text-sm">{item.input}</span>
          <button type="button" onClick={() => onReuse(item.input, item.taskType)}>
            Re-use
          </button>
        </div>
      ))}
      {hasMore && (
        <button type="button" onClick={() => setVisible((prev) => prev + PAGE_SIZE)}>
          Load more
        </button>
      )}
    </div>
  )
}
