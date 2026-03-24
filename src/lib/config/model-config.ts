import type { TaskType } from '@/lib/schemas/route'
import {
  DEFAULT_ANALYST_MODEL,
  DEFAULT_DEAD_CODE_MODEL,
  DEFAULT_DOCSTRING_MODEL,
  DEFAULT_ERROR_EXPLAIN_MODEL,
  DEFAULT_MODELS,
  DEFAULT_NAMING_HELPER_MODEL,
  DEFAULT_PERFORMANCE_HINT_MODEL,
  DEFAULT_TRANSLATE_MODEL,
  DEFAULT_TYPE_HINTS_MODEL,
  OLLAMA_BASE_URL_DEFAULT,
} from '@/lib/router/models'
import { readStorage } from '@/lib/utils/storage'

export interface ModelConfig {
  analystModel: string
  explainModel: string
  testModel: string
  refactorModel: string
  commitModel: string
  translateModel: string
  ollamaBaseUrl: string
  docstringModel: string
  typeHintsModel: string
  errorExplainModel: string
  performanceHintModel: string
  namingHelperModel: string
  deadCodeModel: string
}

export const DEFAULTS: ModelConfig = {
  analystModel: DEFAULT_ANALYST_MODEL,
  commitModel: DEFAULT_MODELS.commit,
  deadCodeModel: DEFAULT_DEAD_CODE_MODEL,
  docstringModel: DEFAULT_DOCSTRING_MODEL,
  errorExplainModel: DEFAULT_ERROR_EXPLAIN_MODEL,
  explainModel: DEFAULT_MODELS.explain,
  namingHelperModel: DEFAULT_NAMING_HELPER_MODEL,
  ollamaBaseUrl: OLLAMA_BASE_URL_DEFAULT,
  performanceHintModel: DEFAULT_PERFORMANCE_HINT_MODEL,
  refactorModel: DEFAULT_MODELS.refactor,
  testModel: DEFAULT_MODELS.test,
  translateModel: DEFAULT_TRANSLATE_MODEL,
  typeHintsModel: DEFAULT_TYPE_HINTS_MODEL,
}

// Prefixed with the app slug so it doesn't collide with other keys on shared origins
export const STORAGE_KEY = 'slm-router-model-config'

type TaskModelKey =
  | 'explainModel'
  | 'testModel'
  | 'refactorModel'
  | 'commitModel'
  | 'docstringModel'
  | 'typeHintsModel'
  | 'errorExplainModel'
  | 'performanceHintModel'
  | 'namingHelperModel'
  | 'deadCodeModel'

export const TASK_MODEL_KEY: Record<TaskType, TaskModelKey> = {
  commit: 'commitModel',
  'dead-code': 'deadCodeModel',
  docstring: 'docstringModel',
  'error-explain': 'errorExplainModel',
  explain: 'explainModel',
  'naming-helper': 'namingHelperModel',
  'performance-hint': 'performanceHintModel',
  refactor: 'refactorModel',
  test: 'testModel',
  'type-hints': 'typeHintsModel',
}

/**
 * Loads the persisted model config from localStorage, merging over DEFAULTS.
 * Merging over DEFAULTS ensures new config keys added in future versions always
 * have a valid fallback without breaking existing stored configs.
 * Safe to call during SSR; returns DEFAULTS when window is undefined.
 */
export function loadModelConfig(): ModelConfig {
  const result = readStorage<Partial<ModelConfig>>(STORAGE_KEY)
  if (result.ok && result.value) {
    return { ...DEFAULTS, ...result.value }
  }
  return DEFAULTS
}

export function getModelForTask(config: ModelConfig, task: TaskType): string {
  return config[TASK_MODEL_KEY[task]]
}

export function getAnalystModel(config: ModelConfig): string {
  return config.analystModel
}

export function getTranslateModel(config: ModelConfig): string {
  return config.translateModel
}
