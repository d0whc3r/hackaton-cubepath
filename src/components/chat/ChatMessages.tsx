import { ArrowDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AssistantBubble } from '@/components/chat/AssistantBubble'
import { EmptyState } from '@/components/chat/EmptyState'
import { UserBubble } from '@/components/chat/UserBubble'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useChatContext } from '@/lib/context/chat-context'

function ChatSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3">
          {/* User bubble */}
          <div className="flex justify-end">
            <div className="w-2/3 space-y-1.5">
              <Skeleton className="ml-auto h-3 w-24 rounded-full" />
              <Skeleton className="h-16 w-full rounded-2xl rounded-tr-sm" />
            </div>
          </div>
          {/* Assistant bubble */}
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
  const { entries, isLoading, isHydrated } = useChatContext()
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Track position for the "jump to bottom" button.
  // Depends on isHydrated + entries.length so it re-runs when the scroll
  // Container first appears in the DOM (it doesn't exist during EmptyState).
  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight
      setIsAtBottom(dist <= BOTTOM_THRESHOLD)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [isHydrated, entries.length])

  // Auto-scroll on new content — reads the live scrollTop at effect time.
  // If the user has already scrolled up, scrollTop is lower and dist > threshold,
  // So we skip. No flag needed; the DOM position is the source of truth.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    if (dist <= BOTTOM_THRESHOLD) {
      el.scrollTop = el.scrollHeight
    }
  }, [entries])

  // When a new query is submitted, jump to bottom so the response is visible
  useEffect(() => {
    if (isLoading) {
      const el = scrollRef.current
      if (el) {
        el.scrollTop = el.scrollHeight
      }
      setIsAtBottom(true)
    }
  }, [isLoading])

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setIsAtBottom(true)
  }

  if (!isHydrated) {
    return (
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <ChatSkeleton />
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
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

      {/* Jump to bottom — shown when user has scrolled up */}
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
