import { buildDeadCodePrompt } from '@/lib/prompts/dead-code'
import { buildDocstringPrompt } from '@/lib/prompts/docstring'
import { buildErrorExplainPrompt } from '@/lib/prompts/error-explain'
import { buildNamingHelperPrompt } from '@/lib/prompts/naming-helper'
import { buildPerformanceHintPrompt } from '@/lib/prompts/performance-hint'
import { buildTypeHintsPrompt } from '@/lib/prompts/type-hints'
import type { CodeContext, TaskType } from './types'
import { DEFAULT_MODELS } from './models'

const STUB_CONTEXT: CodeContext = {
  confidence: 'low',
  isDiff: false,
  language: 'unknown',
  testFramework: null,
}

const DISPLAY_NAMES: Record<DirectTaskType, string> = {
  'dead-code': 'Dead Code',
  docstring: 'Docstring',
  'error-explain': 'Error Explain',
  'naming-helper': 'Naming Helper',
  'performance-hint': 'Performance Hint',
  'type-hints': 'Type Hints',
}

export type DirectTaskType =
  | 'docstring'
  | 'type-hints'
  | 'error-explain'
  | 'performance-hint'
  | 'naming-helper'
  | 'dead-code'

export function isDirectTask(taskType: TaskType): taskType is DirectTaskType {
  return (
    taskType === 'docstring' ||
    taskType === 'type-hints' ||
    taskType === 'error-explain' ||
    taskType === 'performance-hint' ||
    taskType === 'naming-helper' ||
    taskType === 'dead-code'
  )
}

interface DirectRouteResult {
  displayName: string
  modelId: string
  systemPrompt: string
}

export function routeDirect(taskType: DirectTaskType, modelId = DEFAULT_MODELS[taskType]): DirectRouteResult {
  let systemPrompt = ''

  switch (taskType) {
    case 'error-explain': {
      systemPrompt = buildErrorExplainPrompt()
      break
    }
    case 'docstring': {
      systemPrompt = buildDocstringPrompt(STUB_CONTEXT)
      break
    }
    case 'type-hints': {
      systemPrompt = buildTypeHintsPrompt(STUB_CONTEXT)
      break
    }
    case 'performance-hint': {
      systemPrompt = buildPerformanceHintPrompt(STUB_CONTEXT)
      break
    }
    case 'naming-helper': {
      systemPrompt = buildNamingHelperPrompt(STUB_CONTEXT)
      break
    }
    case 'dead-code': {
      systemPrompt = buildDeadCodePrompt(STUB_CONTEXT)
      break
    }
  }

  return {
    displayName: DISPLAY_NAMES[taskType],
    modelId,
    systemPrompt,
  }
}
