import type { ModelRuntime } from '@/lib/router/types'
import type { TaskType } from '@/lib/schemas/route'
import {
  DEFAULT_ANALYST_MODEL_BY_RUNTIME,
  DEFAULT_MODELS_BY_RUNTIME,
  DEFAULT_TRANSLATE_MODEL_BY_RUNTIME,
  OLLAMA_BASE_URL_DEFAULT,
} from '@/lib/router/models'
import { getStorageEngine } from '@/lib/storage/engine'
import { readStorage, removeStorage, writeStorage } from '@/lib/utils/storage'

export interface ModelConfig {
  modelRuntime: ModelRuntime
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
  analystModel: DEFAULT_ANALYST_MODEL_BY_RUNTIME.small,
  commitModel: DEFAULT_MODELS_BY_RUNTIME.small.commit,
  deadCodeModel: DEFAULT_MODELS_BY_RUNTIME.small['dead-code'],
  docstringModel: DEFAULT_MODELS_BY_RUNTIME.small.docstring,
  errorExplainModel: DEFAULT_MODELS_BY_RUNTIME.small['error-explain'],
  explainModel: DEFAULT_MODELS_BY_RUNTIME.small.explain,
  modelRuntime: 'small',
  namingHelperModel: DEFAULT_MODELS_BY_RUNTIME.small['naming-helper'],
  ollamaBaseUrl: OLLAMA_BASE_URL_DEFAULT,
  performanceHintModel: DEFAULT_MODELS_BY_RUNTIME.small['performance-hint'],
  refactorModel: DEFAULT_MODELS_BY_RUNTIME.small.refactor,
  testModel: DEFAULT_MODELS_BY_RUNTIME.small.test,
  translateModel: DEFAULT_TRANSLATE_MODEL_BY_RUNTIME.small,
  typeHintsModel: DEFAULT_MODELS_BY_RUNTIME.small['type-hints'],
}

export function buildDefaultsForRuntime(modelRuntime: ModelRuntime): ModelConfig {
  return {
    ...DEFAULTS,
    analystModel: DEFAULT_ANALYST_MODEL_BY_RUNTIME[modelRuntime],
    commitModel: DEFAULT_MODELS_BY_RUNTIME[modelRuntime].commit,
    deadCodeModel: DEFAULT_MODELS_BY_RUNTIME[modelRuntime]['dead-code'],
    docstringModel: DEFAULT_MODELS_BY_RUNTIME[modelRuntime].docstring,
    errorExplainModel: DEFAULT_MODELS_BY_RUNTIME[modelRuntime]['error-explain'],
    explainModel: DEFAULT_MODELS_BY_RUNTIME[modelRuntime].explain,
    modelRuntime,
    namingHelperModel: DEFAULT_MODELS_BY_RUNTIME[modelRuntime]['naming-helper'],
    performanceHintModel: DEFAULT_MODELS_BY_RUNTIME[modelRuntime]['performance-hint'],
    refactorModel: DEFAULT_MODELS_BY_RUNTIME[modelRuntime].refactor,
    testModel: DEFAULT_MODELS_BY_RUNTIME[modelRuntime].test,
    translateModel: DEFAULT_TRANSLATE_MODEL_BY_RUNTIME[modelRuntime],
    typeHintsModel: DEFAULT_MODELS_BY_RUNTIME[modelRuntime]['type-hints'],
  }
}

// Prefixed with the app slug so it doesn't collide with other keys on shared origins
export const STORAGE_KEY = 'slm-router-model-config'
export const MODEL_CONFIG_UPDATED_EVENT = 'slm-router-model-config:updated'

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
  // Keep sync readers current immediately (same-tab UI updates depend on this).
  writeStorage(STORAGE_KEY, delta)
  globalThis.dispatchEvent(new Event(MODEL_CONFIG_UPDATED_EVENT))
  await engine.write(STORAGE_KEY, delta)
}

/**
 * Removes the persisted config from IDB and localStorage, reverting to DEFAULTS.
 */
export async function removeModelConfig(): Promise<void> {
  removeStorage(STORAGE_KEY)
  globalThis.dispatchEvent(new Event(MODEL_CONFIG_UPDATED_EVENT))
  await engine.remove(STORAGE_KEY)
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
