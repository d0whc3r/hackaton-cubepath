import type { TaskType } from '@/lib/schemas/route'

import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { useChatSession } from '@/hooks/use-chat-session'
import { ChatContext } from '@/lib/context/chat-context'

interface ChatContainerProps {
  fixedTaskType?: TaskType
  pageTitle?: string
  pageDescription?: string
  composer?: React.ReactNode
}

export function ChatContainer({ fixedTaskType, pageTitle, pageDescription, composer }: ChatContainerProps) {
  const session = useChatSession(fixedTaskType)

  return (
    <ChatContext.Provider
      value={{
        activeTask: session.activeTask,
        currentModel: session.currentModel,
        entries: session.entries,
        fixedTaskType,
        handleCancel: session.handleCancel,
        handleClearHistory: session.handleClearHistory,
        handleSubmit: session.handleSubmit,
        isHydrated: session.isHydrated,
        isLoading: session.isLoading,
        setActiveTask: session.setActiveTask,
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {(pageTitle ?? pageDescription) && (
          <div className="shrink-0 border-b border-border/50 px-4 py-3 md:px-6">
            {pageTitle && <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>}
            {pageDescription && <p className="text-xs text-muted-foreground">{pageDescription}</p>}
          </div>
        )}
        <ChatMessages />
        {composer ?? <ChatInput />}
      </div>
    </ChatContext.Provider>
  )
}
