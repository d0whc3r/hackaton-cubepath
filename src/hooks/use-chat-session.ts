import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
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
import { copyNotificationDetails, notify } from '@/lib/ui/notifications'
import { getHistoryHintCount } from '@/lib/utils/history'
import { buildStreamCallbacks } from '@/lib/utils/stream-callbacks'

interface UseChatSessionReturn {
  activeTask: TaskType
  currentModel: string
  entries: ConversationEntry[]
  handleCancel: () => void
  handleClearHistory: () => void
  handleSubmit: (input: string, taskType: TaskType, fileName?: string) => void
  hasPersistedHistory: boolean
  isHydrated: boolean
  isLoading: boolean
  setActiveTask: (task: TaskType) => void
}

function generateEntryId(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) {
    return uuid
  }
  const randomBytes = new Uint32Array(2)
  globalThis.crypto?.getRandomValues?.(randomBytes)
  return `${Date.now()}-${(randomBytes[0] ?? 0).toString(16)}${(randomBytes[1] ?? 0).toString(16)}`
}

export function useChatSession(fixedTaskType?: TaskType): UseChatSessionReturn {
  const defaultTask = fixedTaskType ?? 'explain'

  const {
    entries: entriesByTask,
    loaded: loadedByTask,
    loading: loadingByTask,
  } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const [activeTask, setActiveTask] = useState<TaskType>(defaultTask)
  const [currentModel, setCurrentModel] = useState(() => getModelForTask(DEFAULTS, defaultTask))
  const routeMutationOptions = useMemo(() => buildRouteMutationOptions(), [])
  const routeMutation = useMutation(routeMutationOptions)

  const viewTask = fixedTaskType ?? activeTask

  // Initial hydration
  useEffect(() => {
    ensureLoaded(defaultTask)
    setCurrentModel(getModelForTask(loadModelConfig(), defaultTask))
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
      setActiveTask(task)
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
        errorCode: null,
        routingSteps: [],
        specialist: null,
        status: 'streaming',
      },
      id: generateEntryId(),
      userMessage: { content: input, fileName, taskType: task, timestamp: new Date() },
    })
    setLoading(task, true)

    routeMutation
      .mutateAsync({
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
          const blockReason = error.blockReason ?? undefined
          notify.warning('Request blocked by policy', {
            action: blockReason
              ? {
                  label: 'Copy details',
                  onClick: () => {
                    void copyNotificationDetails(blockReason, 'Block reason copied')
                  },
                }
              : undefined,
            description: blockReason,
          })
          updateLastAssistant(task, (prev: AssistantMessage) => ({
            ...prev,
            blockReason: error.blockReason,
            status: 'blocked',
          }))
          return
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        notify.error('Request failed', {
          action: {
            label: 'Retry',
            onClick: () => handleSubmit(input, task, fileName),
          },
          description: errorMessage,
        })
        updateLastAssistant(task, (prev: AssistantMessage) => ({
          ...prev,
          error: errorMessage,
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
    notify.info('Request canceled', {
      description: 'The current generation has been stopped.',
    })
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

  const hasPersistedHistory = getHistoryHintCount(viewTask) > 0

  return {
    activeTask: viewTask,
    currentModel,
    entries: entriesByTask[viewTask],
    handleCancel,
    handleClearHistory,
    handleSubmit,
    hasPersistedHistory,
    isHydrated: loadedByTask[viewTask],
    isLoading: loadingByTask[viewTask],
    setActiveTask: (task: TaskType) => {
      if (fixedTaskType) {
        return
      }
      setActiveTask(task)
    },
  }
}
