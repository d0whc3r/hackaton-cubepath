import type { ModelOption, TaskType } from '../types'

const CLOUD_SIZE_GB = 0

const CLOUD_CODER_480: ModelOption = {
  contextWindow: 256_000,
  description: 'Qwen3 Coder 480B cloud: strongest coding quality for complex edits and large contexts.',
  id: 'qwen3-coder:480b-cloud',
  label: 'Qwen3 Coder',
  params: '480B (Cloud)',
  size: CLOUD_SIZE_GB,
}

const CLOUD_GLM_47: ModelOption = {
  contextWindow: 128_000,
  description: 'GLM 4.7 cloud: strong coding/reasoning balance with large context.',
  id: 'glm-4.7:cloud',
  label: 'GLM 4.7',
  params: 'Cloud',
  size: CLOUD_SIZE_GB,
}

const CLOUD_MINIMAX_M21: ModelOption = {
  contextWindow: 200_000,
  description: 'MiniMax M2.1 cloud: high coding quality and long-context reliability.',
  id: 'minimax-m2.1:cloud',
  label: 'MiniMax M2.1',
  params: 'Cloud',
  size: CLOUD_SIZE_GB,
}

const CLOUD_GPT_OSS_120: ModelOption = {
  contextWindow: 131_000,
  description: 'GPT-OSS 120B cloud: strong reasoning fallback for difficult engineering tasks.',
  id: 'gpt-oss:120b-cloud',
  label: 'GPT-OSS',
  params: '120B (Cloud)',
  size: CLOUD_SIZE_GB,
}

const CLOUD_GPT_OSS_20: ModelOption = {
  contextWindow: 131_000,
  description: 'GPT-OSS 20B cloud: fast and cost-efficient for concise structured outputs.',
  id: 'gpt-oss:20b-cloud',
  label: 'GPT-OSS',
  params: '20B (Cloud)',
  size: CLOUD_SIZE_GB,
}

const CLOUD_DEEPSEEK_V31: ModelOption = {
  contextWindow: 128_000,
  description: 'DeepSeek V3.1 671B cloud: strong deep-analysis option for harder debugging/refactoring.',
  id: 'deepseek-v3.1:671b-cloud',
  label: 'DeepSeek V3.1',
  params: '671B (Cloud)',
  size: CLOUD_SIZE_GB,
}

const CLOUD_QWEN35: ModelOption = {
  contextWindow: 256_000,
  description: 'Qwen3.5 cloud: multilingual model with strong long-context text quality.',
  id: 'qwen3.5:cloud',
  label: 'Qwen3.5',
  params: 'Cloud',
  size: CLOUD_SIZE_GB,
}

const CLOUD_QWEN35_397: ModelOption = {
  contextWindow: 256_000,
  description: 'Qwen3.5 397B cloud: highest-quality Qwen3.5 tier for nuanced outputs.',
  id: 'qwen3.5:397b-cloud',
  label: 'Qwen3.5',
  params: '397B (Cloud)',
  size: CLOUD_SIZE_GB,
}

export const ANALYST_MODELS_CLOUD: ModelOption[] = [
  CLOUD_GPT_OSS_20,
  CLOUD_GLM_47,
  CLOUD_MINIMAX_M21,
  CLOUD_GPT_OSS_120,
]
export const DEFAULT_ANALYST_MODEL_CLOUD = ANALYST_MODELS_CLOUD[0].id

export const EXPLAIN_MODELS_CLOUD: ModelOption[] = [CLOUD_CODER_480, CLOUD_MINIMAX_M21, CLOUD_GLM_47, CLOUD_GPT_OSS_120]
export const DEFAULT_EXPLAIN_MODEL_CLOUD = EXPLAIN_MODELS_CLOUD[0].id

export const TEST_MODELS_CLOUD: ModelOption[] = [CLOUD_CODER_480, CLOUD_GLM_47, CLOUD_MINIMAX_M21, CLOUD_GPT_OSS_120]
export const DEFAULT_TEST_MODEL_CLOUD = TEST_MODELS_CLOUD[0].id

export const REFACTOR_MODELS_CLOUD: ModelOption[] = [
  CLOUD_CODER_480,
  CLOUD_DEEPSEEK_V31,
  CLOUD_MINIMAX_M21,
  CLOUD_GLM_47,
]
export const DEFAULT_REFACTOR_MODEL_CLOUD = REFACTOR_MODELS_CLOUD[0].id

export const COMMIT_MODELS_CLOUD: ModelOption[] = [CLOUD_GPT_OSS_20, CLOUD_GLM_47, CLOUD_MINIMAX_M21, CLOUD_GPT_OSS_120]
export const DEFAULT_COMMIT_MODEL_CLOUD = COMMIT_MODELS_CLOUD[0].id

export const DOCSTRING_MODELS_CLOUD: ModelOption[] = [
  CLOUD_CODER_480,
  CLOUD_GLM_47,
  CLOUD_MINIMAX_M21,
  CLOUD_GPT_OSS_120,
]
export const DEFAULT_DOCSTRING_MODEL_CLOUD = DOCSTRING_MODELS_CLOUD[0].id

export const TYPE_HINTS_MODELS_CLOUD: ModelOption[] = [
  CLOUD_CODER_480,
  CLOUD_GLM_47,
  CLOUD_DEEPSEEK_V31,
  CLOUD_MINIMAX_M21,
]
export const DEFAULT_TYPE_HINTS_MODEL_CLOUD = TYPE_HINTS_MODELS_CLOUD[0].id

export const ERROR_EXPLAIN_MODELS_CLOUD: ModelOption[] = [
  CLOUD_MINIMAX_M21,
  CLOUD_CODER_480,
  CLOUD_DEEPSEEK_V31,
  CLOUD_GLM_47,
]
export const DEFAULT_ERROR_EXPLAIN_MODEL_CLOUD = ERROR_EXPLAIN_MODELS_CLOUD[0].id

export const PERFORMANCE_HINT_MODELS_CLOUD: ModelOption[] = [
  CLOUD_DEEPSEEK_V31,
  CLOUD_CODER_480,
  CLOUD_MINIMAX_M21,
  CLOUD_GLM_47,
]
export const DEFAULT_PERFORMANCE_HINT_MODEL_CLOUD = PERFORMANCE_HINT_MODELS_CLOUD[0].id

export const NAMING_HELPER_MODELS_CLOUD: ModelOption[] = [
  CLOUD_GPT_OSS_20,
  CLOUD_GLM_47,
  CLOUD_MINIMAX_M21,
  CLOUD_QWEN35,
]
export const DEFAULT_NAMING_HELPER_MODEL_CLOUD = NAMING_HELPER_MODELS_CLOUD[0].id

export const DEAD_CODE_MODELS_CLOUD: ModelOption[] = [
  CLOUD_CODER_480,
  CLOUD_DEEPSEEK_V31,
  CLOUD_MINIMAX_M21,
  CLOUD_GLM_47,
]
export const DEFAULT_DEAD_CODE_MODEL_CLOUD = DEAD_CODE_MODELS_CLOUD[0].id

export const TRANSLATE_MODELS_CLOUD: ModelOption[] = [CLOUD_QWEN35, CLOUD_QWEN35_397, CLOUD_GPT_OSS_120]
export const DEFAULT_TRANSLATE_MODEL_CLOUD = TRANSLATE_MODELS_CLOUD[0].id

export const MODELS_BY_TASK_CLOUD: Record<TaskType, ModelOption[]> = {
  commit: COMMIT_MODELS_CLOUD,
  'dead-code': DEAD_CODE_MODELS_CLOUD,
  docstring: DOCSTRING_MODELS_CLOUD,
  'error-explain': ERROR_EXPLAIN_MODELS_CLOUD,
  explain: EXPLAIN_MODELS_CLOUD,
  'naming-helper': NAMING_HELPER_MODELS_CLOUD,
  'performance-hint': PERFORMANCE_HINT_MODELS_CLOUD,
  refactor: REFACTOR_MODELS_CLOUD,
  test: TEST_MODELS_CLOUD,
  'type-hints': TYPE_HINTS_MODELS_CLOUD,
}

export const DEFAULT_MODELS_CLOUD: Record<TaskType, string> = {
  commit: DEFAULT_COMMIT_MODEL_CLOUD,
  'dead-code': DEFAULT_DEAD_CODE_MODEL_CLOUD,
  docstring: DEFAULT_DOCSTRING_MODEL_CLOUD,
  'error-explain': DEFAULT_ERROR_EXPLAIN_MODEL_CLOUD,
  explain: DEFAULT_EXPLAIN_MODEL_CLOUD,
  'naming-helper': DEFAULT_NAMING_HELPER_MODEL_CLOUD,
  'performance-hint': DEFAULT_PERFORMANCE_HINT_MODEL_CLOUD,
  refactor: DEFAULT_REFACTOR_MODEL_CLOUD,
  test: DEFAULT_TEST_MODEL_CLOUD,
  'type-hints': DEFAULT_TYPE_HINTS_MODEL_CLOUD,
}
