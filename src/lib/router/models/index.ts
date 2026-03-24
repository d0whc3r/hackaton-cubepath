import type { ModelOption, TaskType } from '../types'
import { COMMIT_MODELS, DEFAULT_COMMIT_MODEL } from './commit'
import { DEAD_CODE_MODELS, DEFAULT_DEAD_CODE_MODEL } from './dead-code'
import { DEFAULT_DOCSTRING_MODEL, DOCSTRING_MODELS } from './docstring'
import { DEFAULT_ERROR_EXPLAIN_MODEL, ERROR_EXPLAIN_MODELS } from './error-explain'
import { DEFAULT_EXPLAIN_MODEL, EXPLAIN_MODELS } from './explain'
import { DEFAULT_NAMING_HELPER_MODEL, NAMING_HELPER_MODELS } from './naming-helper'
import { DEFAULT_PERFORMANCE_HINT_MODEL, PERFORMANCE_HINT_MODELS } from './performance-hint'
import { DEFAULT_REFACTOR_MODEL, REFACTOR_MODELS } from './refactor'
import { DEFAULT_TEST_MODEL, TEST_MODELS } from './test'
import { DEFAULT_TYPE_HINTS_MODEL, TYPE_HINTS_MODELS } from './type-hints'

export type { ModelOption } from '../types'

export { ANALYST_MODELS, DEFAULT_ANALYST_MODEL } from './analyst'
export { COMMIT_MODELS, DEFAULT_COMMIT_MODEL } from './commit'
export { DEAD_CODE_MODELS, DEFAULT_DEAD_CODE_MODEL } from './dead-code'
export { DEFAULT_DOCSTRING_MODEL, DOCSTRING_MODELS } from './docstring'
export { DEFAULT_ERROR_EXPLAIN_MODEL, ERROR_EXPLAIN_MODELS } from './error-explain'
export { DEFAULT_EXPLAIN_MODEL, EXPLAIN_MODELS } from './explain'
export { DEFAULT_NAMING_HELPER_MODEL, NAMING_HELPER_MODELS } from './naming-helper'
export { DEFAULT_PERFORMANCE_HINT_MODEL, PERFORMANCE_HINT_MODELS } from './performance-hint'
export { DEFAULT_REFACTOR_MODEL, REFACTOR_MODELS } from './refactor'
export { DEFAULT_TEST_MODEL, TEST_MODELS } from './test'
export { DEFAULT_TRANSLATE_MODEL, TRANSLATE_MODELS } from './translate'
export { DEFAULT_TYPE_HINTS_MODEL, TYPE_HINTS_MODELS } from './type-hints'

export const MODELS_BY_TASK: Record<TaskType, ModelOption[]> = {
  commit: COMMIT_MODELS,
  'dead-code': DEAD_CODE_MODELS,
  docstring: DOCSTRING_MODELS,
  'error-explain': ERROR_EXPLAIN_MODELS,
  explain: EXPLAIN_MODELS,
  'naming-helper': NAMING_HELPER_MODELS,
  'performance-hint': PERFORMANCE_HINT_MODELS,
  refactor: REFACTOR_MODELS,
  test: TEST_MODELS,
  'type-hints': TYPE_HINTS_MODELS,
}

export const DEFAULT_MODELS: Record<TaskType, string> = {
  commit: DEFAULT_COMMIT_MODEL,
  'dead-code': DEFAULT_DEAD_CODE_MODEL,
  docstring: DEFAULT_DOCSTRING_MODEL,
  'error-explain': DEFAULT_ERROR_EXPLAIN_MODEL,
  explain: DEFAULT_EXPLAIN_MODEL,
  'naming-helper': DEFAULT_NAMING_HELPER_MODEL,
  'performance-hint': DEFAULT_PERFORMANCE_HINT_MODEL,
  refactor: DEFAULT_REFACTOR_MODEL,
  test: DEFAULT_TEST_MODEL,
  'type-hints': DEFAULT_TYPE_HINTS_MODEL,
}

export const OLLAMA_BASE_URL_DEFAULT = 'http://localhost:11434'
