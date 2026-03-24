import { useSyncExternalStore } from 'react'
import {
  appendEntry,
  clearTask,
  ensureLoaded,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  updateLastAssistant,
} from '@/lib/stores/chat-store'

export type { AssistantUpdater } from '@/lib/stores/chat-store'
export { TASK_TYPES } from '@/lib/stores/chat-store'

export function useTaskHistory() {
  const { entries: entriesByTask } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return {
    appendEntry,
    clearTask,
    ensureLoaded,
    entriesByTask,
    updateLastAssistant,
  }
}
