import type { ConversationEntry, TaskType } from '@/lib/schemas/route'
import { getStorageEngine } from '@/lib/storage/engine'
import { readStorage, removeStorage, writeStorage } from '@/lib/utils/storage'

const HISTORY_KEY_PREFIX = 'slm-router-history'
const MAX_ENTRIES = 50

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
}

export async function loadHistoryAsync(taskType: TaskType | undefined): Promise<ConversationEntry[]> {
  const data = await historyEngine().read<SerializedEntry[]>(historyKey(taskType))
  if (!data) {
    return []
  }
  return fromSerializedEntries(data)
}

export async function clearHistoryAsync(taskType: TaskType | undefined): Promise<void> {
  await historyEngine().remove(historyKey(taskType))
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
}
