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
let _entries: EntriesByTask = emptyEntries()
let _loading: LoadingByTask = emptyLoading()
let _unread: UnreadByTask = emptyUnread()
const _loadedTasks = new Set<TaskType>()
const _abortControllers: Partial<Record<TaskType, AbortController>> = {}

// --- Subscription for useSyncExternalStore ---
type Listener = () => void
const _listeners = new Set<Listener>()

export interface StoreSnapshot {
  entries: EntriesByTask
  loading: LoadingByTask
  unread: UnreadByTask
}

let _snapshot: StoreSnapshot = { entries: _entries, loading: _loading, unread: _unread }

function _notify(): void {
  _snapshot = { entries: _entries, loading: _loading, unread: _unread }
  _listeners.forEach((fn) => fn())
}

export function subscribe(listener: Listener): () => void {
  _listeners.add(listener)
  return () => {
    _listeners.delete(listener)
  }
}

export function getSnapshot(): StoreSnapshot {
  return _snapshot
}

export function getServerSnapshot(): StoreSnapshot {
  return { entries: emptyEntries(), loading: emptyLoading(), unread: emptyUnread() }
}

// --- Actions ---

export function ensureLoaded(task: TaskType): void {
  if (_loadedTasks.has(task)) {
    return
  }
  _loadedTasks.add(task)
  _entries = { ..._entries, [task]: loadHistory(task) }
  _notify()
}

export function appendEntry(task: TaskType, entry: ConversationEntry): void {
  _entries = { ..._entries, [task]: [..._entries[task], entry] }
  saveHistory(_entries[task], task)
  _notify()
}

export function updateLastAssistant(task: TaskType, updater: AssistantUpdater): void {
  const taskEntries = _entries[task]
  if (taskEntries.length === 0) {
    return
  }
  const next = [...taskEntries]
  const last = next.at(-1)
  if (!last) {
    return
  }
  next[next.length - 1] = { ...last, assistantMessage: updater(last.assistantMessage) }
  _entries = { ..._entries, [task]: next }
  saveHistory(_entries[task], task)
  _notify()
}

export function clearTask(task: TaskType): void {
  clearHistory(task)
  _entries = { ..._entries, [task]: [] }
  _unread = { ..._unread, [task]: false }
  _notify()
}

export function setLoading(task: TaskType, loading: boolean): void {
  _loading = { ..._loading, [task]: loading }
  _notify()
}

/** Marks a task as having a completed result the user hasn't seen yet. */
export function markTaskDone(task: TaskType): void {
  _unread = { ..._unread, [task]: true }
  _notify()
}

/** Clears the unread indicator for a task (called when the user navigates to it). */
export function markRead(task: TaskType): void {
  if (!_unread[task]) {
    return
  }
  _unread = { ..._unread, [task]: false }
  _notify()
}

export function getAbortController(task: TaskType): AbortController | undefined {
  return _abortControllers[task]
}

export function setAbortController(task: TaskType, controller: AbortController | undefined): void {
  _abortControllers[task] = controller
}

/** Resets all store state. Intended for use in tests only. */
export function resetStore(): void {
  _entries = emptyEntries()
  _loading = emptyLoading()
  _unread = emptyUnread()
  _loadedTasks.clear()
  for (const key of Object.keys(_abortControllers) as TaskType[]) {
    delete _abortControllers[key]
  }
  _notify()
}
