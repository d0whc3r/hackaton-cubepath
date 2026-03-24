import { useEffect, useState, useSyncExternalStore } from 'react'
import type { AssistantMessage, ConversationEntry, TaskType } from '@/lib/schemas/route'
import { DEFAULTS, getAnalystModel, getModelForTask, loadModelConfig } from '@/lib/config/model-config'
import { BlockedError, buildRouteMutationOptions } from '@/lib/services/route.service'
import {
  appendEntry,
  clearTask,
  ensureLoaded,
  getAbortController,
  getServerSnapshot,
  getSnapshot,
  setAbortController,
  setLoading,
  subscribe,
  updateLastAssistant,
} from '@/lib/stores/chat-store'
import { buildStreamCallbacks } from '@/lib/utils/stream-callbacks'

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

export function useChatSession(fixedTaskType?: TaskType): UseChatSessionReturn {
  const defaultTask = fixedTaskType ?? 'explain'

  const { entries: entriesByTask, loading: loadingByTask } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  const [activeTask, setActiveTaskState] = useState<TaskType>(defaultTask)
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentModel, setCurrentModel] = useState(() => getModelForTask(DEFAULTS, defaultTask))

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

    getAbortController(task)?.abort()
    const abort = new AbortController()
    setAbortController(task, abort)

    appendEntry(task, {
      assistantMessage: {
        blockReason: null,
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
    setLoading(task, true)

    const { mutationFn } = buildRouteMutationOptions()
    if (!mutationFn) {
      updateLastAssistant(task, (prev: AssistantMessage) => ({
        ...prev,
        error: 'Route mutation is not configured.',
        status: 'error',
      }))
      setLoading(task, false)
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
          updateLastAssistant(task, (prev: AssistantMessage) => ({ ...prev, status: 'interrupted' }))
          return
        }
        if (error instanceof BlockedError) {
          updateLastAssistant(task, (prev: AssistantMessage) => ({
            ...prev,
            blockReason: error.blockReason,
            status: 'blocked',
          }))
          return
        }
        updateLastAssistant(task, (prev: AssistantMessage) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
        }))
      })
      .finally(() => {
        if (getAbortController(task) === abort) {
          setAbortController(task, undefined)
        }
        setLoading(task, false)
      })
  }

  function handleCancel() {
    const task = viewTask
    getAbortController(task)?.abort()
    setLoading(task, false)
    updateLastAssistant(task, (prev: AssistantMessage) => ({
      ...prev,
      routingSteps: prev.routingSteps.map((step) =>
        step.status === 'active' ? { ...step, status: 'error' as const } : step,
      ),
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
