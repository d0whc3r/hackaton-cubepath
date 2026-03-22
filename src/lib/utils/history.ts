import type { ConversationEntry, TaskType } from '@/lib/schemas/route'

import { readStorage, removeStorage, writeStorage } from '@/lib/utils/storage'

const HISTORY_KEY_PREFIX = 'slm-router-history'
const MAX_ENTRIES = 50

interface SerializedEntry extends Omit<ConversationEntry, 'userMessage'> {
  userMessage: Omit<ConversationEntry['userMessage'], 'timestamp'> & { timestamp: string }
}

/** Guard: undefined produces the key "slm-router-history-undefined"; fall back to 'explain' */
function historyKey(taskType: TaskType | string | undefined): string {
  return `${HISTORY_KEY_PREFIX}-${taskType ?? 'explain'}`
}

function toSerializedEntries(entries: ConversationEntry[]): SerializedEntry[] {
  return entries.slice(-MAX_ENTRIES).map((e) => ({
    ...e,
    assistantMessage: {
      ...e.assistantMessage,
      status: e.assistantMessage.status === 'streaming' ? 'interrupted' : e.assistantMessage.status,
    },
    userMessage: { ...e.userMessage, timestamp: e.userMessage.timestamp.toISOString() },
  }))
}

function fromSerializedEntries(data: SerializedEntry[]): ConversationEntry[] {
  return data.map((e) => ({
    ...e,
    userMessage: { ...e.userMessage, timestamp: new Date(e.userMessage.timestamp) },
  }))
}

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
