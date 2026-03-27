import type { AssistantMessage, RoutingStep, TaskType } from '@/lib/schemas/route'
import type { SSECallbacks } from '@/lib/utils/sse'
import { markTaskDone } from '@/lib/stores/chat-store'
import { addSaving } from '@/lib/utils/savings'

type AssistantUpdater = (prev: AssistantMessage) => AssistantMessage

export const GENERATION_FAILED: RoutingStep = {
  label: 'Generation failed',
  status: 'error',
  step: 'generating_response',
}

export const GENERATION_STOPPED: RoutingStep = {
  label: 'Generation stopped',
  status: 'error',
  step: 'generating_response',
}

export function mergeRoutingStep(steps: RoutingStep[], incoming: RoutingStep): RoutingStep[] {
  const idx = steps.findIndex((st) => st.step === incoming.step)
  if (idx === -1) {
    return [...steps, incoming]
  }
  return steps.map((st, i) => (i === idx ? incoming : st))
}

export function buildStreamCallbacks(
  task: TaskType,
  update: (task: TaskType, updater: AssistantUpdater) => void,
): SSECallbacks {
  return {
    onCost: (cost) => {
      update(task, (prev) => ({ ...prev, cost }))
      void addSaving(cost.largeModelCostUsd, cost.inputTokens, cost.outputTokens)
    },
    onDone: () => {
      update(task, (prev) => ({ ...prev, status: 'done' }))
      markTaskDone(task)
    },
    onError: ({ code, message }) =>
      update(task, (prev) => ({
        ...prev,
        error: message,
        errorCode: code,
        routingSteps: mergeRoutingStep(prev.routingSteps, GENERATION_FAILED),
        status: 'error',
      })),
    onInterrupted: () =>
      update(task, (prev) => ({
        ...prev,
        routingSteps: mergeRoutingStep(prev.routingSteps, GENERATION_STOPPED),
        status: 'interrupted',
      })),
    onResponseChunk: (text) => update(task, (prev) => ({ ...prev, content: prev.content + text })),
    onRoutingStep: (step) =>
      update(task, (prev) => ({ ...prev, routingSteps: mergeRoutingStep(prev.routingSteps, step) })),
    onSpecialistSelected: (payload) => update(task, (prev) => ({ ...prev, specialist: payload })),
  }
}
