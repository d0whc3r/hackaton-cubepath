import type { ModelOption, TaskType } from '../types'

// ── Small-PC preset ────────────────────────────────────────────────────────────
// All models here are ≤ 2.5 GB on disk and run comfortably on a machine with
// 4 GB of total RAM (OS ~1.5 GB + Ollama ~200 MB → ~2.3 GB available for model).
// Ollama loads one model at a time, so only the active model needs to fit.

// ── Shared small models ───────────────────────────────────────────────────────

const SMALL_QWEN25_05B: ModelOption = {
  contextWindow: 32_768,
  description: 'Alibaba · 0.4 GB, fastest option for simple structured outputs with minimal RAM',
  id: 'qwen2.5:0.5b',
  label: 'Qwen 2.5',
  params: '0.5B',
  size: 0.398,
}

const SMALL_QWEN25_15B: ModelOption = {
  contextWindow: 32_768,
  description: 'Alibaba · 1 GB, good balance of quality and speed for lightweight machines',
  id: 'qwen2.5:1.5b',
  label: 'Qwen 2.5',
  params: '1.5B',
  size: 0.986,
}

const SMALL_LLAMA32_1B: ModelOption = {
  contextWindow: 131_072,
  description: 'Meta · 1.3 GB, 128K context — good classifier when snippets are long',
  id: 'llama3.2:1b',
  label: 'Llama 3.2',
  params: '1B',
  size: 1.3,
}

const SMALL_GRANITE33_2B: ModelOption = {
  contextWindow: 131_072,
  description: 'IBM · 1.5 GB, 128K context, reliable instruction following and JSON output',
  id: 'granite3.3:2b',
  label: 'Granite 3.3',
  params: '2B',
  size: 1.5,
}

const SMALL_QWEN25_CODER_05B: ModelOption = {
  contextWindow: 32_768,
  description: 'Alibaba · 0.4 GB, smallest diff-aware option for fast local commit generation',
  id: 'qwen2.5-coder:0.5b',
  label: 'Qwen2.5 Coder',
  params: '0.5B',
  size: 0.398,
}

const SMALL_QWEN25_CODER_15B: ModelOption = {
  contextWindow: 32_768,
  description: 'Alibaba · 1 GB, best lightweight code-tuned model for annotations and short tasks',
  id: 'qwen2.5-coder:1.5b',
  label: 'Qwen2.5 Coder',
  params: '1.5B',
  size: 0.986,
}

const SMALL_QWEN25_CODER_3B: ModelOption = {
  contextWindow: 32_768,
  description: 'Alibaba · 1.9 GB, strongest code model that fits in 4 GB RAM — good for most tasks',
  id: 'qwen2.5-coder:3b',
  label: 'Qwen2.5 Coder',
  params: '3B',
  size: 1.9,
}

const SMALL_GRANITE_CODE_3B: ModelOption = {
  contextWindow: 128_000,
  description: 'IBM · 2 GB, 128K context — long-file analysis without truncation on budget hardware',
  id: 'granite-code:3b',
  label: 'Granite Code',
  params: '3B',
  size: 2,
}

const SMALL_PHI4_MINI: ModelOption = {
  contextWindow: 131_072,
  description: 'Microsoft · 2.5 GB, 128K context, native function-calling — best reasoning in budget',
  id: 'phi4-mini:3.8b',
  label: 'Phi 4 Mini',
  params: '3.8B',
  size: 2.5,
}

const SMALL_GEMMA3_TRANSLATOR_1B: ModelOption = {
  contextWindow: 131_072,
  description: 'Community · 0.8 GB, lightest dedicated translator for very constrained setups',
  id: 'zongwei/gemma3-translator:1b',
  label: 'Gemma3 Translator',
  params: '1B',
  size: 0.815,
}

const SMALL_ICKY_TRANSLATE: ModelOption = {
  contextWindow: 8192,
  description: 'icky · 1.6 GB, tiny dedicated translator, useful prose-only option',
  id: 'icky/translate',
  label: 'icky/translate',
  params: '~1B',
  size: 1.6,
}

// ── Per-task exports ──────────────────────────────────────────────────────────

export const ANALYST_MODELS_SMALL: ModelOption[] = [
  SMALL_QWEN25_05B,
  SMALL_QWEN25_15B,
  SMALL_LLAMA32_1B,
  SMALL_GRANITE33_2B,
]
export const DEFAULT_ANALYST_MODEL_SMALL = ANALYST_MODELS_SMALL[0].id

export const EXPLAIN_MODELS_SMALL: ModelOption[] = [
  SMALL_QWEN25_CODER_3B,
  SMALL_GRANITE_CODE_3B,
  SMALL_PHI4_MINI,
  SMALL_QWEN25_CODER_15B,
]
export const DEFAULT_EXPLAIN_MODEL_SMALL = EXPLAIN_MODELS_SMALL[0].id

export const TEST_MODELS_SMALL: ModelOption[] = [SMALL_QWEN25_CODER_3B, SMALL_GRANITE_CODE_3B, SMALL_QWEN25_CODER_15B]
export const DEFAULT_TEST_MODEL_SMALL = TEST_MODELS_SMALL[0].id

export const REFACTOR_MODELS_SMALL: ModelOption[] = [
  SMALL_QWEN25_CODER_3B,
  SMALL_PHI4_MINI,
  SMALL_GRANITE_CODE_3B,
  SMALL_QWEN25_CODER_15B,
]
export const DEFAULT_REFACTOR_MODEL_SMALL = REFACTOR_MODELS_SMALL[0].id

export const COMMIT_MODELS_SMALL: ModelOption[] = [
  SMALL_QWEN25_CODER_15B,
  SMALL_QWEN25_CODER_05B,
  SMALL_GRANITE33_2B,
  SMALL_QWEN25_CODER_3B,
]
export const DEFAULT_COMMIT_MODEL_SMALL = COMMIT_MODELS_SMALL[0].id

export const DOCSTRING_MODELS_SMALL: ModelOption[] = [SMALL_QWEN25_CODER_15B, SMALL_QWEN25_CODER_3B, SMALL_GRANITE33_2B]
export const DEFAULT_DOCSTRING_MODEL_SMALL = DOCSTRING_MODELS_SMALL[0].id

export const TYPE_HINTS_MODELS_SMALL: ModelOption[] = [
  SMALL_QWEN25_CODER_15B,
  SMALL_QWEN25_CODER_3B,
  SMALL_GRANITE_CODE_3B,
]
export const DEFAULT_TYPE_HINTS_MODEL_SMALL = TYPE_HINTS_MODELS_SMALL[0].id

export const ERROR_EXPLAIN_MODELS_SMALL: ModelOption[] = [SMALL_PHI4_MINI, SMALL_QWEN25_CODER_3B, SMALL_GRANITE33_2B]
export const DEFAULT_ERROR_EXPLAIN_MODEL_SMALL = ERROR_EXPLAIN_MODELS_SMALL[0].id

export const PERFORMANCE_HINT_MODELS_SMALL: ModelOption[] = [
  SMALL_QWEN25_CODER_3B,
  SMALL_PHI4_MINI,
  SMALL_GRANITE_CODE_3B,
]
export const DEFAULT_PERFORMANCE_HINT_MODEL_SMALL = PERFORMANCE_HINT_MODELS_SMALL[0].id

export const NAMING_HELPER_MODELS_SMALL: ModelOption[] = [SMALL_GRANITE33_2B, SMALL_QWEN25_CODER_15B, SMALL_PHI4_MINI]
export const DEFAULT_NAMING_HELPER_MODEL_SMALL = NAMING_HELPER_MODELS_SMALL[0].id

export const DEAD_CODE_MODELS_SMALL: ModelOption[] = [
  SMALL_QWEN25_CODER_3B,
  SMALL_GRANITE_CODE_3B,
  SMALL_QWEN25_CODER_15B,
]
export const DEFAULT_DEAD_CODE_MODEL_SMALL = DEAD_CODE_MODELS_SMALL[0].id

export const TRANSLATE_MODELS_SMALL: ModelOption[] = [SMALL_GEMMA3_TRANSLATOR_1B, SMALL_ICKY_TRANSLATE]
export const DEFAULT_TRANSLATE_MODEL_SMALL = TRANSLATE_MODELS_SMALL[0].id

export const MODELS_BY_TASK_SMALL: Record<TaskType, ModelOption[]> = {
  commit: COMMIT_MODELS_SMALL,
  'dead-code': DEAD_CODE_MODELS_SMALL,
  docstring: DOCSTRING_MODELS_SMALL,
  'error-explain': ERROR_EXPLAIN_MODELS_SMALL,
  explain: EXPLAIN_MODELS_SMALL,
  'naming-helper': NAMING_HELPER_MODELS_SMALL,
  'performance-hint': PERFORMANCE_HINT_MODELS_SMALL,
  refactor: REFACTOR_MODELS_SMALL,
  test: TEST_MODELS_SMALL,
  'type-hints': TYPE_HINTS_MODELS_SMALL,
}

export const DEFAULT_MODELS_SMALL: Record<TaskType, string> = {
  commit: DEFAULT_COMMIT_MODEL_SMALL,
  'dead-code': DEFAULT_DEAD_CODE_MODEL_SMALL,
  docstring: DEFAULT_DOCSTRING_MODEL_SMALL,
  'error-explain': DEFAULT_ERROR_EXPLAIN_MODEL_SMALL,
  explain: DEFAULT_EXPLAIN_MODEL_SMALL,
  'naming-helper': DEFAULT_NAMING_HELPER_MODEL_SMALL,
  'performance-hint': DEFAULT_PERFORMANCE_HINT_MODEL_SMALL,
  refactor: DEFAULT_REFACTOR_MODEL_SMALL,
  test: DEFAULT_TEST_MODEL_SMALL,
  'type-hints': DEFAULT_TYPE_HINTS_MODEL_SMALL,
}
