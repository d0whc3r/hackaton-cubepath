import type { AssistantMessage, ConversationEntry, TaskType } from '@/lib/schemas/route'
import { clearHistoryAsync, loadHistoryAsync, saveHistoryAsync } from '@/lib/utils/history'

export type AssistantUpdater = (prev: AssistantMessage) => AssistantMessage

type EntriesByTask = Record<TaskType, ConversationEntry[]>
type LoadingByTask = Record<TaskType, boolean>
type UnreadByTask = Record<TaskType, boolean>
type LoadedByTask = Record<TaskType, boolean>

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

function buildTaskRecord<T>(createValue: (task: TaskType) => T): Record<TaskType, T> {
  const result = {} as Record<TaskType, T>
  for (const task of TASK_TYPES) {
    result[task] = createValue(task)
  }
  return result
}

function emptyEntries(): EntriesByTask {
  return buildTaskRecord(() => [])
}

function emptyLoading(): LoadingByTask {
  return buildTaskRecord(() => false)
}

function emptyUnread(): UnreadByTask {
  return buildTaskRecord(() => false)
}

function emptyLoaded(): LoadedByTask {
  return buildTaskRecord(() => false)
}

// --- Singleton state (persists across Astro page navigations) ---
let entries: EntriesByTask = emptyEntries()
let loading: LoadingByTask = emptyLoading()
let unread: UnreadByTask = emptyUnread()
let loaded: LoadedByTask = emptyLoaded()
const loadedTasks = new Set<TaskType>()
const abortControllers: Partial<Record<TaskType, AbortController>> = {}

// --- Subscription for useSyncExternalStore ---
type Listener = () => void
const listeners = new Set<Listener>()

export interface StoreSnapshot {
  entries: EntriesByTask
  loaded: LoadedByTask
  loading: LoadingByTask
  unread: UnreadByTask
}

let snapshot: StoreSnapshot = { entries, loaded, loading, unread }
const serverSnapshot: StoreSnapshot = {
  entries: emptyEntries(),
  loaded: emptyLoaded(),
  loading: emptyLoading(),
  unread: emptyUnread(),
}

function notify(): void {
  snapshot = { entries, loaded, loading, unread }
  listeners.forEach((fn) => fn())
}

function reportPersistenceError(action: 'clear' | 'save', task: TaskType, error: unknown): void {
  console.error(`[chat-store] Failed to ${action} history for task:`, task, error)
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
  void loadHistoryAsync(task)
    .then((loadedEntries) => {
      entries = { ...entries, [task]: loadedEntries }
    })
    .catch((error: unknown) => {
      // History load failure is recoverable — the user starts with an empty list.
      console.error('[chat-store] Failed to load history for task:', task, error)
    })
    .finally(() => {
      // Per-task hydration status for UI gating.
      // This lets the UI distinguish "still loading history" from "loaded and empty".
      loaded = { ...loaded, [task]: true }
      notify()
    })
}

export function appendEntry(task: TaskType, entry: ConversationEntry): void {
  entries = { ...entries, [task]: [...entries[task], entry] }
  void saveHistoryAsync(entries[task], task).catch((error: unknown) => {
    reportPersistenceError('save', task, error)
  })
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
  void saveHistoryAsync(entries[task], task).catch((error: unknown) => {
    reportPersistenceError('save', task, error)
  })
  notify()
}

export function clearTask(task: TaskType): void {
  void clearHistoryAsync(task).catch((error: unknown) => {
    reportPersistenceError('clear', task, error)
  })
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
  loaded = emptyLoaded()
  loading = emptyLoading()
  unread = emptyUnread()
  loadedTasks.clear()
  for (const key of Object.keys(abortControllers) as TaskType[]) {
    delete abortControllers[key]
  }
  notify()
}
