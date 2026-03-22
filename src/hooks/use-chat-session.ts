import { useEffect, useRef, useState } from 'react'

import type { AssistantMessage, ConversationEntry, RoutingStep, TaskType } from '@/lib/schemas/route'

import { DEFAULTS, getAnalystModel, getModelForTask, loadModelConfig } from '@/lib/config/model-config'
import { buildRouteMutationOptions } from '@/lib/services/route.service'
import { clearHistory, loadHistory, saveHistory } from '@/lib/utils/history'
import { addSaving } from '@/lib/utils/savings'

export interface UseChatSessionReturn {
  entries: ConversationEntry[]
  activeTask: TaskType
  isLoading: boolean
  isHydrated: boolean
  currentModel: string
  setActiveTask: (task: TaskType) => void
  handleSubmit: (input: string, taskType: TaskType, fileName?: string) => void
  handleCancel: () => void
  handleClearHistory: () => void
}

type AssistantUpdater = (prev: AssistantMessage) => AssistantMessage
type EntriesByTask = Record<TaskType, ConversationEntry[]>
type LoadingByTask = Record<TaskType, boolean>

const TASK_TYPES: TaskType[] = [
  'explain',
  'test',
  'refactor',
  'commit',
  'docstring',
  'type-hints',
  'error-explain',
  'performance-hint',
  'naming-helper',
  'dead-code',
]

const EMPTY_ENTRIES_BY_TASK = Object.fromEntries(TASK_TYPES.map((task) => [task, []])) as EntriesByTask
const EMPTY_LOADING_BY_TASK = Object.fromEntries(TASK_TYPES.map((task) => [task, false])) as LoadingByTask

function mergeRoutingStep(steps: RoutingStep[], step: RoutingStep): RoutingStep[] {
  const idx = steps.findIndex((st) => st.step === step.step)
  if (idx === -1) {
    return [...steps, step]
  }
  return steps.map((st, i) => (i === idx ? step : st))
}

export function useChatSession(fixedTaskType?: TaskType): UseChatSessionReturn {
  const defaultTask = fixedTaskType ?? 'explain'

  const [entriesByTask, setEntriesByTask] = useState<EntriesByTask>(EMPTY_ENTRIES_BY_TASK)
  const [loadingByTask, setLoadingByTask] = useState<LoadingByTask>(EMPTY_LOADING_BY_TASK)
  const [activeTask, setActiveTask] = useState<TaskType>(defaultTask)
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentModel, setCurrentModel] = useState(() => getModelForTask(DEFAULTS, defaultTask))

  const loadedTasksRef = useRef<Set<TaskType>>(new Set())
  const abortControllersRef = useRef<Partial<Record<TaskType, AbortController>>>({})

  const viewTask = fixedTaskType ?? activeTask

  function ensureTaskHistoryLoaded(task: TaskType) {
    if (loadedTasksRef.current.has(task)) {
      return
    }
    loadedTasksRef.current.add(task)
    setEntriesByTask((prev) => ({ ...prev, [task]: loadHistory(task) }))
  }

  // Initial hydration
  useEffect(() => {
    ensureTaskHistoryLoaded(defaultTask)
    setCurrentModel(getModelForTask(loadModelConfig(), defaultTask))
    setIsHydrated(true)
  }, [defaultTask])

  // Load history lazily when switching visible task and sync model badge
  useEffect(() => {
    ensureTaskHistoryLoaded(viewTask)
    setCurrentModel(getModelForTask(loadModelConfig(), viewTask))
  }, [viewTask])

  // Persist loaded task histories
  useEffect(() => {
    loadedTasksRef.current.forEach((task) => {
      saveHistory(entriesByTask[task], task)
    })
  }, [entriesByTask])

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
      nextTaskEntries[nextTaskEntries.length - 1] = {
        ...last,
        assistantMessage: updater(last.assistantMessage),
      }
      return { ...prev, [task]: nextTaskEntries }
    })
  }

  function handleSubmit(input: string, submittedTaskType: TaskType, fileName?: string) {
    const task = fixedTaskType ?? submittedTaskType
    const config = loadModelConfig()
    const model = getModelForTask(config, task)

    ensureTaskHistoryLoaded(task)

    if (!fixedTaskType) {
      setActiveTask(task)
    }
    setCurrentModel(model)

    // Cancel only an in-flight request for the same task.
    abortControllersRef.current[task]?.abort()
    const abort = new AbortController()
    abortControllersRef.current[task] = abort

    const newEntry: ConversationEntry = {
      assistantMessage: {
        content: '',
        cost: null,
        error: null,
        routingSteps: [],
        specialist: null,
        status: 'streaming',
      },
      id: `${Date.now()}-${Math.random()}`,
      userMessage: { content: input, fileName, taskType: task, timestamp: new Date() },
    }

    setEntriesByTask((prev) => ({
      ...prev,
      [task]: [...prev[task], newEntry],
    }))
    setLoadingByTask((prev) => ({ ...prev, [task]: true }))

    const { mutationFn } = buildRouteMutationOptions()
    if (!mutationFn) {
      updateLastAssistant(task, (prev) => ({ ...prev, error: 'Route mutation is not configured.', status: 'error' }))
      setLoadingByTask((prev) => ({ ...prev, [task]: false }))
      return
    }

    void mutationFn({
      analystModel: getAnalystModel(config),
      callbacks: {
        onCost: (cost) => {
          updateLastAssistant(task, (prev) => ({ ...prev, cost }))
          addSaving(cost.largeModelCostUsd, cost.inputTokens, cost.outputTokens)
        },
        onDone: () => updateLastAssistant(task, (prev) => ({ ...prev, status: 'done' })),
        onError: (message) => updateLastAssistant(task, (prev) => ({ ...prev, error: message, status: 'error' })),
        onInterrupted: () => updateLastAssistant(task, (prev) => ({ ...prev, status: 'interrupted' })),
        onResponseChunk: (text) => updateLastAssistant(task, (prev) => ({ ...prev, content: prev.content + text })),
        onRoutingStep: (step) =>
          updateLastAssistant(task, (prev) => ({ ...prev, routingSteps: mergeRoutingStep(prev.routingSteps, step) })),
        onSpecialistSelected: (payload) => updateLastAssistant(task, (prev) => ({ ...prev, specialist: payload })),
      },
      commitModel: config.commitModel,
      deadCodeModel: config.deadCodeModel,
      docstringModel: config.docstringModel,
      errorExplainModel: config.errorExplainModel,
      explainModel: config.explainModel,
      input,
      namingHelperModel: config.namingHelperModel,
      ollamaBaseUrl: config.ollamaBaseUrl,
      performanceHintModel: config.performanceHintModel,
      refactorModel: config.refactorModel,
      signal: abort.signal,
      taskType: task,
      testModel: config.testModel,
      typeHintsModel: config.typeHintsModel,
    })
      .catch((error) => {
        if (abort.signal.aborted) {
          updateLastAssistant(task, (prev) => ({ ...prev, status: 'interrupted' }))
          return
        }
        updateLastAssistant(task, (prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
        }))
      })
      .finally(() => {
        if (abortControllersRef.current[task] === abort) {
          abortControllersRef.current[task] = undefined
        }
        setLoadingByTask((prev) => ({ ...prev, [task]: false }))
      })
  }

  function handleCancel() {
    const task = viewTask
    abortControllersRef.current[task]?.abort()
    setLoadingByTask((prev) => ({ ...prev, [task]: false }))
    updateLastAssistant(task, (prev) => ({ ...prev, status: 'interrupted' }))
  }

  function handleClearHistory() {
    const task = viewTask
    clearHistory(task)
    setEntriesByTask((prev) => ({ ...prev, [task]: [] }))
  }

  return {
    activeTask: viewTask,
    currentModel,
    entries: entriesByTask[viewTask],
    handleCancel,
    handleClearHistory,
    handleSubmit,
    isHydrated,
    isLoading: loadingByTask[viewTask],
    setActiveTask: (task: TaskType) => {
      if (fixedTaskType) {
        return
      }
      setActiveTask(task)
    },
  }
}
