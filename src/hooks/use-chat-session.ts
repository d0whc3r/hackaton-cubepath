import { useEffect, useRef, useState } from 'react'

import type { ConversationEntry, TaskType } from '@/lib/schemas/route'

import { DEFAULTS, getAnalystModel, getModelForTask, loadModelConfig } from '@/lib/config/model-config'
import { buildRouteMutationOptions } from '@/lib/services/route.service'
import { buildStreamCallbacks, GENERATION_STOPPED, mergeRoutingStep } from '@/lib/utils/stream-callbacks'

import { TASK_TYPES, useTaskHistory } from './use-task-history'

export interface UseChatSessionReturn {
  activeTask: TaskType
  currentModel: string
  entries: ConversationEntry[]
  handleCancel: () => void
  handleClearHistory: () => void
  handleSubmit: (input: string, taskType: TaskType, fileName?: string) => void
  isHydrated: boolean
  isLoading: boolean
  setActiveTask: (task: TaskType) => void
}

type LoadingByTask = Record<TaskType, boolean>

const EMPTY_LOADING_BY_TASK = Object.fromEntries(TASK_TYPES.map((task) => [task, false])) as LoadingByTask

export function useChatSession(fixedTaskType?: TaskType): UseChatSessionReturn {
  const defaultTask = fixedTaskType ?? 'explain'

  const { appendEntry, clearTask, entriesByTask, ensureLoaded, updateLastAssistant } = useTaskHistory()

  const [loadingByTask, setLoadingByTask] = useState<LoadingByTask>(EMPTY_LOADING_BY_TASK)
  const [activeTask, setActiveTaskState] = useState<TaskType>(defaultTask)
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentModel, setCurrentModel] = useState(() => getModelForTask(DEFAULTS, defaultTask))
  const abortControllersRef = useRef<Partial<Record<TaskType, AbortController>>>({})

  const viewTask = fixedTaskType ?? activeTask

  // Initial hydration
  useEffect(() => {
    ensureLoaded(defaultTask)
    setCurrentModel(getModelForTask(loadModelConfig(), defaultTask))
    setIsHydrated(true)
  }, [defaultTask])

  // Load history lazily when switching visible task and sync model badge
  useEffect(() => {
    ensureLoaded(viewTask)
    setCurrentModel(getModelForTask(loadModelConfig(), viewTask))
  }, [viewTask])

  function handleSubmit(input: string, submittedTaskType: TaskType, fileName?: string) {
    const task = fixedTaskType ?? submittedTaskType
    const config = loadModelConfig()

    ensureLoaded(task)
    if (!fixedTaskType) {
      setActiveTaskState(task)
    }
    setCurrentModel(getModelForTask(config, task))

    abortControllersRef.current[task]?.abort()
    const abort = new AbortController()
    abortControllersRef.current[task] = abort

    appendEntry(task, {
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
    })
    setLoadingByTask((prev) => ({ ...prev, [task]: true }))

    const { mutationFn } = buildRouteMutationOptions()
    if (!mutationFn) {
      updateLastAssistant(task, (prev) => ({ ...prev, error: 'Route mutation is not configured.', status: 'error' }))
      setLoadingByTask((prev) => ({ ...prev, [task]: false }))
      return
    }

    void mutationFn({
      analystModel: getAnalystModel(config),
      callbacks: buildStreamCallbacks(task, updateLastAssistant),
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
    updateLastAssistant(task, (prev) => ({
      ...prev,
      routingSteps: mergeRoutingStep(prev.routingSteps, GENERATION_STOPPED),
      status: 'interrupted',
    }))
  }

  function handleClearHistory() {
    clearTask(viewTask)
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
      setActiveTaskState(task)
    },
  }
}
