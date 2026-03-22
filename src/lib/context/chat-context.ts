import { createContext, useContext } from 'react'

import type { ConversationEntry, TaskType } from '@/lib/schemas/route'

export interface ChatContextValue {
  readonly entries: ConversationEntry[]
  readonly isLoading: boolean
  readonly isHydrated: boolean
  readonly activeTask: TaskType
  readonly fixedTaskType?: TaskType
  readonly currentModel: string
  setActiveTask: (task: TaskType) => void
  handleSubmit: (input: string, taskType: TaskType, fileName?: string) => void
  handleCancel: () => void
  handleClearHistory: () => void
}

export const ChatContext = createContext<ChatContextValue | null>(null)

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useChatContext must be used within ChatContainer')
  }
  return ctx
}
