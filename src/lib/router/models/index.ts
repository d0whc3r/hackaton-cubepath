import type { ModelOption, TaskType } from '../types'

import { COMMIT_MODELS, DEFAULT_COMMIT_MODEL } from './commit'
import { DEFAULT_EXPLAIN_MODEL, EXPLAIN_MODELS } from './explain'
import { DEFAULT_REFACTOR_MODEL, REFACTOR_MODELS } from './refactor'
import { DEFAULT_TEST_MODEL, TEST_MODELS } from './test'

export type { ModelOption } from '../types'

export { ANALYST_MODELS, DEFAULT_ANALYST_MODEL } from './analyst'
export { COMMIT_MODELS, DEFAULT_COMMIT_MODEL } from './commit'
export { DEFAULT_EXPLAIN_MODEL, EXPLAIN_MODELS } from './explain'
export { DEFAULT_REFACTOR_MODEL, REFACTOR_MODELS } from './refactor'
export { DEFAULT_TEST_MODEL, TEST_MODELS } from './test'
export { DEFAULT_TRANSLATE_MODEL, TRANSLATE_MODELS } from './translate'

export const MODELS_BY_TASK: Record<TaskType, ModelOption[]> = {
  commit: COMMIT_MODELS,
  explain: EXPLAIN_MODELS,
  refactor: REFACTOR_MODELS,
  test: TEST_MODELS,
}

export const DEFAULT_MODELS: Record<TaskType, string> = {
  commit: DEFAULT_COMMIT_MODEL,
  explain: DEFAULT_EXPLAIN_MODEL,
  refactor: DEFAULT_REFACTOR_MODEL,
  test: DEFAULT_TEST_MODEL,
}

export const OLLAMA_BASE_URL_DEFAULT = 'http://localhost:11434'
