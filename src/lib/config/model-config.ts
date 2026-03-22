import type { TaskType } from '@/lib/schemas/route'

import {
  DEFAULT_ANALYST_MODEL,
  DEFAULT_MODELS,
  DEFAULT_TRANSLATE_MODEL,
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
}

export const DEFAULTS: ModelConfig = {
  analystModel: DEFAULT_ANALYST_MODEL,
  commitModel: DEFAULT_MODELS.commit,
  explainModel: DEFAULT_MODELS.explain,
  ollamaBaseUrl: OLLAMA_BASE_URL_DEFAULT,
  refactorModel: DEFAULT_MODELS.refactor,
  testModel: DEFAULT_MODELS.test,
  translateModel: DEFAULT_TRANSLATE_MODEL,
}

// Prefixed with the app slug so it doesn't collide with other keys on shared origins
export const STORAGE_KEY = 'slm-router-model-config'

type TaskModelKey = 'explainModel' | 'testModel' | 'refactorModel' | 'commitModel'

export const TASK_MODEL_KEY: Record<TaskType, TaskModelKey> = {
  commit: 'commitModel',
  explain: 'explainModel',
  refactor: 'refactorModel',
  test: 'testModel',
}

/**
 * Loads the persisted model config from localStorage, merging over DEFAULTS.
 * Merging over DEFAULTS ensures new config keys added in future versions always
 * have a valid fallback without breaking existing stored configs.
 * Safe to call during SSR — returns DEFAULTS when window is undefined.
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
