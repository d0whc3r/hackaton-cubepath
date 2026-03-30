import type { ModelOption, TaskType } from '../types'
import {
  BASE_GRANITE33_2B,
  BASE_GRANITE_CODE_3B,
  BASE_LLAMA32_1B,
  BASE_QWEN25_05B,
  BASE_QWEN25_15B,
  BASE_QWEN25_CODER_05B,
  BASE_QWEN25_CODER_15B,
  BASE_QWEN25_CODER_3B,
} from './shared'

// ── Small-PC preset ────────────────────────────────────────────────────────────
// All models here are ≤ 2.5 GB on disk and run comfortably on a machine with
// 4 GB of total RAM (OS ~1.5 GB + Ollama ~200 MB → ~2.3 GB available for model).
// Ollama loads one model at a time, so only the active model needs to fit.

// ── Shared small models ───────────────────────────────────────────────────────

const SMALL_QWEN25_05B: ModelOption = {
  ...BASE_QWEN25_05B,
  description: 'Alibaba · 0.4 GB, fastest option for simple structured outputs with minimal RAM',
}

const SMALL_QWEN25_15B: ModelOption = {
  ...BASE_QWEN25_15B,
  description: 'Alibaba · 1 GB, good balance of quality and speed for lightweight machines',
}

const SMALL_LLAMA32_1B: ModelOption = {
  ...BASE_LLAMA32_1B,
  description: 'Meta · 1.3 GB, 128K context — good classifier when snippets are long',
}

const SMALL_GRANITE33_2B: ModelOption = {
  ...BASE_GRANITE33_2B,
  description: 'IBM · 1.5 GB, 128K context, reliable instruction following and JSON output',
}

const SMALL_QWEN25_CODER_05B: ModelOption = {
  ...BASE_QWEN25_CODER_05B,
  description: 'Alibaba · 0.4 GB, smallest diff-aware option for fast local commit generation',
}

const SMALL_QWEN25_CODER_15B: ModelOption = {
  ...BASE_QWEN25_CODER_15B,
  description: 'Alibaba · 1 GB, best lightweight code-tuned model for annotations and short tasks',
}

const SMALL_QWEN25_CODER_3B: ModelOption = {
  ...BASE_QWEN25_CODER_3B,
  description: 'Alibaba · 1.9 GB, strongest code model that fits in 4 GB RAM — good for most tasks',
}

const SMALL_GRANITE_CODE_3B: ModelOption = {
  ...BASE_GRANITE_CODE_3B,
  description: 'IBM · 2 GB, 128K context — long-file analysis without truncation on budget hardware',
}

// Phi3 (2.2 GB) was explicitly designed by Microsoft for CPU-only and memory-constrained
// Environments. It fits comfortably within the ~2.3 GB budget and is widely validated on
// Raspberry Pi / 4 GB machines. Replaces phi4-mini:3.8b which at 2.5 GB exceeded the budget.
const SMALL_PHI3: ModelOption = {
  contextWindow: 131_072,
  description: 'Microsoft · 2.2 GB, 128K context, designed for CPU-only edge devices — best reasoning in budget',
  id: 'phi3:3.8b',
  label: 'Phi 3 Mini',
  params: '3.8B',
  size: 2.2,
}

const SMALL_GEMMA3_TRANSLATOR_1B: ModelOption = {
  contextWindow: 32_768,
  description: 'Community (Gemma 3) · 0.8 GB, translation-only behavior with very low RAM footprint',
  id: 'zongwei/gemma3-translator:1b',
  label: 'Gemma3 Translator',
  params: '1B',
  size: 0.815,
}

const SMALL_ICKY_TRANSLATE: ModelOption = {
  contextWindow: 8192,
  description: 'icky · 1.6 GB, dedicated tiny translator for constrained CPUs and low-memory setups',
  id: 'icky/translate',
  label: 'icky/translate',
  params: '~2.6B',
  size: 1.6,
}

const SMALL_HY_MT15_18B: ModelOption = {
  contextWindow: 8192,
  description: 'Tencent Hunyuan MT 1.5 · 1.8B, translation-specialized model focused on quality/speed balance',
  id: 'demonbyron/HY-MT1.5-1.8B',
  label: 'HY-MT 1.5',
  params: '1.8B',
  size: 1.8,
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
  SMALL_PHI3,
  SMALL_QWEN25_CODER_15B,
]
export const DEFAULT_EXPLAIN_MODEL_SMALL = EXPLAIN_MODELS_SMALL[0].id

export const TEST_MODELS_SMALL: ModelOption[] = [SMALL_QWEN25_CODER_3B, SMALL_GRANITE_CODE_3B, SMALL_QWEN25_CODER_15B]
export const DEFAULT_TEST_MODEL_SMALL = TEST_MODELS_SMALL[0].id

export const REFACTOR_MODELS_SMALL: ModelOption[] = [
  SMALL_QWEN25_CODER_3B,
  SMALL_PHI3,
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

export const ERROR_EXPLAIN_MODELS_SMALL: ModelOption[] = [SMALL_PHI3, SMALL_QWEN25_CODER_3B, SMALL_GRANITE33_2B]
export const DEFAULT_ERROR_EXPLAIN_MODEL_SMALL = ERROR_EXPLAIN_MODELS_SMALL[0].id

export const PERFORMANCE_HINT_MODELS_SMALL: ModelOption[] = [SMALL_QWEN25_CODER_3B, SMALL_PHI3, SMALL_GRANITE_CODE_3B]
export const DEFAULT_PERFORMANCE_HINT_MODEL_SMALL = PERFORMANCE_HINT_MODELS_SMALL[0].id

export const NAMING_HELPER_MODELS_SMALL: ModelOption[] = [SMALL_GRANITE33_2B, SMALL_QWEN25_CODER_15B, SMALL_PHI3]
export const DEFAULT_NAMING_HELPER_MODEL_SMALL = NAMING_HELPER_MODELS_SMALL[0].id

export const DEAD_CODE_MODELS_SMALL: ModelOption[] = [
  SMALL_QWEN25_CODER_3B,
  SMALL_GRANITE_CODE_3B,
  SMALL_QWEN25_CODER_15B,
]
export const DEFAULT_DEAD_CODE_MODEL_SMALL = DEAD_CODE_MODELS_SMALL[0].id

export const TRANSLATE_MODELS_SMALL: ModelOption[] = [
  SMALL_HY_MT15_18B,
  SMALL_GEMMA3_TRANSLATOR_1B,
  SMALL_ICKY_TRANSLATE,
]
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
