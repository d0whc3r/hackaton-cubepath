import type { SseEmitter } from '@/lib/api/sse'
import type { TaskType } from '@/lib/schemas/route'

import type { RoutingDecision } from './types'

export function emitLanguageDetection(decision: RoutingDecision, emit: SseEmitter): void {
  emit('routing_step', {
    detail: decision.codeContext.language,
    label: `${decision.codeContext.language} detected`,
    status: 'done',
    step: 'detecting_language',
  })
}

export function emitTaskAnalysis(taskType: TaskType, emit: SseEmitter): void {
  emit('routing_step', { label: 'Analysing task type...', status: 'active', step: 'analyzing_task' })
  emit('routing_step', {
    detail: taskType,
    label: `Task: ${taskType}`,
    status: 'done',
    step: 'analyzing_task',
  })
}

export function emitSpecialistSelection(decision: RoutingDecision, emit: SseEmitter): void {
  emit('routing_step', { label: 'Selecting specialist...', status: 'active', step: 'selecting_specialist' })
  emit('routing_step', {
    label: `${decision.specialist.displayName} selected`,
    status: 'done',
    step: 'selecting_specialist',
  })
  emit('specialist_selected', {
    displayName: decision.specialist.displayName,
    language: decision.codeContext.language,
    modelId: decision.specialist.modelId,
    reason: decision.routingReason,
    specialistId: decision.specialist.id,
  })
}
