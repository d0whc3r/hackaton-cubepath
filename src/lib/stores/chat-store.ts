import type { AssistantMessage, ConversationEntry, TaskType } from '@/lib/schemas/route'

import { clearHistory, loadHistory, saveHistory } from '@/lib/utils/history'

export type AssistantUpdater = (prev: AssistantMessage) => AssistantMessage

type EntriesByTask = Record<TaskType, ConversationEntry[]>
type LoadingByTask = Record<TaskType, boolean>
type UnreadByTask = Record<TaskType, boolean>

export const TASK_TYPES: TaskType[] = [
  'commit',
  'dead-code',
  'docstring',
  'error-explain',
  'explain',
  'naming-helper',
  'performance-hint',
  'refactor',
  'test',
  'type-hints',
]

function emptyEntries(): EntriesByTask {
  return Object.fromEntries(TASK_TYPES.map((task) => [task, []])) as unknown as EntriesByTask
}

function emptyLoading(): LoadingByTask {
  return Object.fromEntries(TASK_TYPES.map((task) => [task, false])) as LoadingByTask
}

function emptyUnread(): UnreadByTask {
  return Object.fromEntries(TASK_TYPES.map((task) => [task, false])) as UnreadByTask
}

// --- Singleton state (persists across Astro page navigations) ---
let entries: EntriesByTask = emptyEntries()
let loading: LoadingByTask = emptyLoading()
let unread: UnreadByTask = emptyUnread()
const loadedTasks = new Set<TaskType>()
const abortControllers: Partial<Record<TaskType, AbortController>> = {}

// --- Subscription for useSyncExternalStore ---
type Listener = () => void
const listeners = new Set<Listener>()

export interface StoreSnapshot {
  entries: EntriesByTask
  loading: LoadingByTask
  unread: UnreadByTask
}

let snapshot: StoreSnapshot = { entries, loading, unread }
const serverSnapshot: StoreSnapshot = { entries: emptyEntries(), loading: emptyLoading(), unread: emptyUnread() }

function notify(): void {
  snapshot = { entries, loading, unread }
  listeners.forEach((fn) => fn())
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot(): StoreSnapshot {
  return snapshot
}

export function getServerSnapshot(): StoreSnapshot {
  return serverSnapshot
}

// --- Actions ---

export function ensureLoaded(task: TaskType): void {
  if (loadedTasks.has(task)) {
    return
  }
  loadedTasks.add(task)
  entries = { ...entries, [task]: loadHistory(task) }
  notify()
}

export function appendEntry(task: TaskType, entry: ConversationEntry): void {
  entries = { ...entries, [task]: [...entries[task], entry] }
  saveHistory(entries[task], task)
  notify()
}

export function updateLastAssistant(task: TaskType, updater: AssistantUpdater): void {
  const taskEntries = entries[task]
  if (taskEntries.length === 0) {
    return
  }
  const next = [...taskEntries]
  const last = next.at(-1)
  if (!last) {
    return
  }
  next[next.length - 1] = { ...last, assistantMessage: updater(last.assistantMessage) }
  entries = { ...entries, [task]: next }
  saveHistory(entries[task], task)
  notify()
}

export function clearTask(task: TaskType): void {
  clearHistory(task)
  entries = { ...entries, [task]: [] }
  unread = { ...unread, [task]: false }
  notify()
}

export function setLoading(task: TaskType, value: boolean): void {
  loading = { ...loading, [task]: value }
  notify()
}

/** Marks a task as having a completed result the user hasn't seen yet. */
export function markTaskDone(task: TaskType): void {
  unread = { ...unread, [task]: true }
  notify()
}

/** Clears the unread indicator for a task (called when the user navigates to it). */
export function markRead(task: TaskType): void {
  if (!unread[task]) {
    return
  }
  unread = { ...unread, [task]: false }
  notify()
}

export function getAbortController(task: TaskType): AbortController | undefined {
  return abortControllers[task]
}

export function setAbortController(task: TaskType, controller: AbortController | undefined): void {
  abortControllers[task] = controller
}

/** Resets all store state. Intended for use in tests only. */
export function resetStore(): void {
  entries = emptyEntries()
  loading = emptyLoading()
  unread = emptyUnread()
  loadedTasks.clear()
  for (const key of Object.keys(abortControllers) as TaskType[]) {
    delete abortControllers[key]
  }
  notify()
}
