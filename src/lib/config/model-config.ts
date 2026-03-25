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
import { getStorageEngine } from '@/lib/storage/engine'
import { readStorage, removeStorage, writeStorage } from '@/lib/utils/storage'

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

const engine = getStorageEngine('settings')

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

/** Returns only the keys of config that differ from DEFAULTS — avoids storing redundant data. */
function diffFromDefaults(config: ModelConfig): Partial<ModelConfig> {
  return Object.fromEntries(
    Object.entries(config).filter(([key, value]) => value !== DEFAULTS[key as keyof ModelConfig]),
  ) as Partial<ModelConfig>
}

/**
 * Saves model config to IDB (primary) and localStorage (write-through so sync callers keep working).
 * Only stores keys that differ from DEFAULTS.
 */
export async function saveModelConfig(config: ModelConfig): Promise<void> {
  const delta = diffFromDefaults(config)
  await engine.write(STORAGE_KEY, delta)
  // Write-through: localStorage keeps sync callers (loadModelConfig) up to date
  writeStorage(STORAGE_KEY, delta)
}

/**
 * Removes the persisted config from IDB and localStorage, reverting to DEFAULTS.
 */
export async function removeModelConfig(): Promise<void> {
  await engine.remove(STORAGE_KEY)
  removeStorage(STORAGE_KEY)
}

/**
 * Loads config from IDB, merging over DEFAULTS.
 * Async — use in useEffect or event handlers.
 */
export async function loadModelConfigAsync(): Promise<ModelConfig> {
  const delta = await engine.read<Partial<ModelConfig>>(STORAGE_KEY)
  return delta ? { ...DEFAULTS, ...delta } : DEFAULTS
}

/**
 * Loads config from localStorage synchronously, merging over DEFAULTS.
 * Safe for SSR and sync render paths. Kept in sync by saveModelConfig's write-through.
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
