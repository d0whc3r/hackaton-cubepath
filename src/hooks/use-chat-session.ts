import { useMutation } from '@tanstack/react-query'
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

function mergeRoutingStep(steps: RoutingStep[], step: RoutingStep): RoutingStep[] {
  const idx = steps.findIndex((st) => st.step === step.step)
  if (idx === -1) {
    return [...steps, step]
  }
  return steps.map((st, i) => (i === idx ? step : st))
}

export function useChatSession(fixedTaskType?: TaskType): UseChatSessionReturn {
  const taskType = fixedTaskType ?? 'explain'

  const [entries, setEntries] = useState<ConversationEntry[]>([])
  const [activeTask, setActiveTask] = useState<TaskType>(taskType)
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentModel, setCurrentModel] = useState(() => getModelForTask(DEFAULTS, fixedTaskType ?? taskType))
  const abortRef = useRef<AbortController | null>(null)

  // Load history and real model config after hydration to avoid SSR/client mismatch
  useEffect(() => {
    const config = loadModelConfig()
    setEntries(loadHistory(taskType))
    setCurrentModel(getModelForTask(config, fixedTaskType ?? taskType))
    setIsHydrated(true)
  }, [taskType, fixedTaskType])

  // Side effect: writes to localStorage
  useEffect(() => {
    saveHistory(entries, fixedTaskType ?? activeTask)
  }, [entries, fixedTaskType, activeTask])

  function updateLastAssistant(updater: AssistantUpdater) {
    setEntries((prev) => {
      if (prev.length === 0) {
        return prev
      }
      const next = [...prev]
      const last = next.at(-1)!
      next[next.length - 1] = { ...last, assistantMessage: updater(last.assistantMessage) }
      return next
    })
  }

  const { mutate, isPending } = useMutation(buildRouteMutationOptions())

  function handleSubmit(input: string, submittedTaskType: TaskType, fileName?: string) {
    const config = loadModelConfig()
    setCurrentModel(getModelForTask(config, fixedTaskType ?? submittedTaskType))

    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

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
      userMessage: { content: input, fileName, taskType: submittedTaskType, timestamp: new Date() },
    }

    setEntries((prev) => [...prev, newEntry])
    if (!fixedTaskType) {
      setActiveTask(submittedTaskType)
    }

    mutate({
      analystModel: getAnalystModel(config),
      callbacks: {
        onCost: (cost) => {
          updateLastAssistant((prev) => ({ ...prev, cost }))
          addSaving(cost.largeModelCostUsd, cost.inputTokens, cost.outputTokens)
        },
        onDone: () => updateLastAssistant((prev) => ({ ...prev, status: 'done' })),
        onError: (message) => updateLastAssistant((prev) => ({ ...prev, error: message, status: 'error' })),
        onInterrupted: () => updateLastAssistant((prev) => ({ ...prev, status: 'interrupted' })),
        onResponseChunk: (text) => updateLastAssistant((prev) => ({ ...prev, content: prev.content + text })),
        onRoutingStep: (step) =>
          updateLastAssistant((prev) => ({ ...prev, routingSteps: mergeRoutingStep(prev.routingSteps, step) })),
        onSpecialistSelected: (payload) => updateLastAssistant((prev) => ({ ...prev, specialist: payload })),
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
      taskType: submittedTaskType,
      testModel: config.testModel,
      typeHintsModel: config.typeHintsModel,
    })
  }

  function handleCancel() {
    abortRef.current?.abort()
    updateLastAssistant((prev) => ({ ...prev, status: 'interrupted' }))
  }

  function handleClearHistory() {
    // Side effect: writes to localStorage
    clearHistory(fixedTaskType ?? activeTask)
    setEntries([])
  }

  return {
    activeTask: fixedTaskType ?? activeTask,
    currentModel,
    entries,
    handleCancel,
    handleClearHistory,
    handleSubmit,
    isHydrated,
    isLoading: isPending,
    setActiveTask: (task: TaskType) => {
      if (!fixedTaskType) {
        setActiveTask(task)
      }
    },
  }
}
