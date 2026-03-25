import { ArrowDown } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AssistantBubble } from '@/components/chat/AssistantBubble'
import { EmptyState } from '@/components/chat/EmptyState'
import { UserBubble } from '@/components/chat/UserBubble'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useChatContext } from '@/lib/context/chat-context'
import { getServerSnapshot, getSnapshot, markRead, subscribe } from '@/lib/stores/chat-store'

function ChatSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex justify-end">
            <div className="w-2/3 space-y-1.5">
              <Skeleton className="ml-auto h-3 w-24 rounded-full" />
              <Skeleton className="h-16 w-full rounded-2xl rounded-tr-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 rounded-full" />
            <Skeleton className="h-24 w-full rounded-2xl rounded-tl-sm" />
            <Skeleton className="h-3 w-3/4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

const BOTTOM_THRESHOLD = 80 // Px from bottom considered "at bottom"

export function ChatMessages() {
  const { entries, hasPersistedHistory, isLoading, isHydrated, activeTask } = useChatContext()
  const { unread } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const isAtBottomRef = useRef(true)

  function checkBottom(el: HTMLDivElement) {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD
  }

  // Track scroll position; clear unread badge when the user reaches the bottom.
  // Re-runs when entries.length changes so the listener attaches once the container exists.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }
    const onScroll = () => {
      const atBottom = checkBottom(el)
      setIsAtBottom(atBottom)
      isAtBottomRef.current = atBottom
      if (atBottom) {
        markRead(activeTask)
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [isHydrated, entries.length, activeTask])

  // Auto-scroll on new content when already near the bottom.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }
    if (checkBottom(el)) {
      el.scrollTop = el.scrollHeight
      markRead(activeTask)
    }
  }, [entries, activeTask])

  // When the task finishes and the user is already at the bottom, clear the unread
  // Badge immediately without waiting for a scroll event.
  const isTaskUnread = unread[activeTask]
  useEffect(() => {
    if (isTaskUnread && isAtBottomRef.current) {
      markRead(activeTask)
    }
  }, [isTaskUnread, activeTask])

  // When switching tasks, jump to bottom so the latest response is visible.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }
    el.scrollTop = el.scrollHeight
    setIsAtBottom(true)
    isAtBottomRef.current = true
  }, [activeTask])

  // When history finishes loading (isHydrated: false → true), jump to bottom.
  useEffect(() => {
    if (!isHydrated) {
      return
    }
    const el = scrollRef.current
    if (!el) {
      return
    }
    el.scrollTop = el.scrollHeight
    setIsAtBottom(true)
    isAtBottomRef.current = true
    markRead(activeTask)
  }, [isHydrated, activeTask])

  // When a new query is submitted, jump to bottom so the response is visible.
  useEffect(() => {
    if (isLoading) {
      const el = scrollRef.current
      if (el) {
        el.scrollTop = el.scrollHeight
      }
      setIsAtBottom(true)
      isAtBottomRef.current = true
    }
  }, [isLoading])

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setIsAtBottom(true)
    isAtBottomRef.current = true
    markRead(activeTask)
  }

  // Show skeleton only when we actually expect persisted history to appear.
  if (!isHydrated && hasPersistedHistory) {
    return (
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <ChatSkeleton />
        </div>
      </div>
    )
  }

  if (!isHydrated || entries.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      {/* Scrollable messages area */}
      <div ref={scrollRef} className="h-full overflow-y-auto">
        <div className="space-y-6 p-4 md:p-6">
          {entries.map((entry) => (
            <div key={entry.id} className="space-y-3">
              <UserBubble msg={entry.userMessage} />
              <AssistantBubble msg={entry.assistantMessage} />
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Jump to bottom; shown when user has scrolled up */}
      {!isAtBottom && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          <Button
            size="sm"
            variant="secondary"
            onClick={scrollToBottom}
            className="h-8 gap-1.5 rounded-full px-3 text-xs shadow-md"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Jump to bottom
          </Button>
        </div>
      )}
    </div>
  )
}
