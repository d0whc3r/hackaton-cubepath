import { useEffect, useRef, useState } from 'react'

import type { AssistantMessage, ConversationEntry, TaskType } from '@/lib/schemas/route'

import { clearHistory, loadHistory, saveHistory } from '@/lib/utils/history'

export type AssistantUpdater = (prev: AssistantMessage) => AssistantMessage
type EntriesByTask = Record<TaskType, ConversationEntry[]>

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

const EMPTY_ENTRIES_BY_TASK = Object.fromEntries(TASK_TYPES.map((task) => [task, []])) as unknown as EntriesByTask

export function useTaskHistory() {
  const [entriesByTask, setEntriesByTask] = useState<EntriesByTask>(EMPTY_ENTRIES_BY_TASK)
  const loadedTasksRef = useRef<Set<TaskType>>(new Set())

  // Persist loaded task histories whenever entries change
  useEffect(() => {
    loadedTasksRef.current.forEach((task) => {
      saveHistory(entriesByTask[task], task)
    })
  }, [entriesByTask])

  function ensureLoaded(task: TaskType) {
    if (loadedTasksRef.current.has(task)) {
      return
    }
    loadedTasksRef.current.add(task)
    setEntriesByTask((prev) => ({ ...prev, [task]: loadHistory(task) }))
  }

  function appendEntry(task: TaskType, entry: ConversationEntry) {
    setEntriesByTask((prev) => ({ ...prev, [task]: [...prev[task], entry] }))
  }

  function updateLastAssistant(task: TaskType, updater: AssistantUpdater) {
    setEntriesByTask((prev) => {
      const taskEntries = prev[task]
      if (taskEntries.length === 0) {
        return prev
      }
      const nextTaskEntries = [...taskEntries]
      const last = nextTaskEntries.at(-1)
      if (!last) {
        return prev
      }
      nextTaskEntries[nextTaskEntries.length - 1] = { ...last, assistantMessage: updater(last.assistantMessage) }
      return { ...prev, [task]: nextTaskEntries }
    })
  }

  function clearTask(task: TaskType) {
    clearHistory(task)
    setEntriesByTask((prev) => ({ ...prev, [task]: [] }))
  }

  return { appendEntry, clearTask, ensureLoaded, entriesByTask, updateLastAssistant }
}
