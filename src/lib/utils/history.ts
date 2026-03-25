import type { ConversationEntry, TaskType } from '@/lib/schemas/route'
import { getStorageEngine } from '@/lib/storage/engine'
import { readStorage, removeStorage, writeStorage } from '@/lib/utils/storage'

const HISTORY_KEY_PREFIX = 'slm-router-history'
const HISTORY_META_KEY = 'slm-router-history-meta'
const MAX_ENTRIES = 50

type HistoryMeta = Partial<Record<TaskType, number>>

// Lazy singleton — evaluated after module init so SSR doesn't instantiate IDB
let cachedEngine: ReturnType<typeof getStorageEngine> | null = null
function historyEngine() {
  cachedEngine ??= getStorageEngine('history')
  return cachedEngine
}

interface SerializedEntry extends Omit<ConversationEntry, 'userMessage'> {
  userMessage: Omit<ConversationEntry['userMessage'], 'timestamp'> & { timestamp: string }
}

/** Guard: undefined produces the key "slm-router-history-undefined"; fall back to 'explain' */
function historyKey(taskType: TaskType | string | undefined): string {
  return `${HISTORY_KEY_PREFIX}-${taskType ?? 'explain'}`
}

function readMeta(): HistoryMeta {
  const result = readStorage<HistoryMeta>(HISTORY_META_KEY, { defaultValue: {} })
  if (!result.ok || !result.value) {
    return {}
  }
  return result.value
}

function writeMeta(taskType: TaskType | undefined, count: number): void {
  if (!taskType) {
    return
  }
  const next = { ...readMeta(), [taskType]: count }
  writeStorage(HISTORY_META_KEY, next)
}

function toSerializedEntries(entries: ConversationEntry[]): SerializedEntry[] {
  return entries.slice(-MAX_ENTRIES).map((entry) => ({
    ...entry,
    assistantMessage: {
      ...entry.assistantMessage,
      status: entry.assistantMessage.status === `streaming` ? `interrupted` : entry.assistantMessage.status,
    },
    userMessage: { ...entry.userMessage, timestamp: entry.userMessage.timestamp.toISOString() },
  }))
}

function fromSerializedEntries(data: SerializedEntry[]): ConversationEntry[] {
  return data.map((entry) => ({
    ...entry,
    userMessage: { ...entry.userMessage, timestamp: new Date(entry.userMessage.timestamp) },
  }))
}

// --- Async API (preferred): routes through the transparent storage engine ---

export async function saveHistoryAsync(entries: ConversationEntry[], taskType: TaskType | undefined): Promise<void> {
  await historyEngine().write(historyKey(taskType), toSerializedEntries(entries))
  writeMeta(taskType, Math.min(entries.length, MAX_ENTRIES))
}

export async function loadHistoryAsync(taskType: TaskType | undefined): Promise<ConversationEntry[]> {
  const data = await historyEngine().read<SerializedEntry[]>(historyKey(taskType))
  if (!data) {
    writeMeta(taskType, 0)
    return []
  }
  writeMeta(taskType, data.length)
  return fromSerializedEntries(data)
}

export async function clearHistoryAsync(taskType: TaskType | undefined): Promise<void> {
  await historyEngine().remove(historyKey(taskType))
  writeMeta(taskType, 0)
}

// --- Sync API (legacy): direct localStorage access, kept for SSR-safe initial render ---

export function saveHistory(entries: ConversationEntry[], taskType: TaskType | undefined): void {
  writeStorage(historyKey(taskType), toSerializedEntries(entries))
}

export function loadHistory(taskType: TaskType | undefined): ConversationEntry[] {
  const result = readStorage<SerializedEntry[]>(historyKey(taskType), { defaultValue: [] })
  if (!result.ok || !result.value) {
    return []
  }
  return fromSerializedEntries(result.value)
}

export function clearHistory(taskType: TaskType | undefined): void {
  removeStorage(historyKey(taskType))
  writeMeta(taskType, 0)
}

export function getHistoryHintCount(taskType: TaskType | undefined): number {
  if (!taskType) {
    return 0
  }
  const meta = readMeta()
  return typeof meta[taskType] === 'number' ? (meta[taskType] ?? 0) : 0
}
