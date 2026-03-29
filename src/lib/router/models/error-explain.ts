import type { ModelOption } from '../types'
import {
  BASE_GRANITE_CODE_3B,
  BASE_GRANITE_CODE_8B,
  BASE_PHI4_MINI,
  BASE_QWEN25_CODER_3B,
  BASE_QWEN25_CODER_7B,
} from './shared'

// ── Error explanation ─────────────────────────────────────────────────────────
// Code-specialist models for parsing stack traces, identifying root causes,
// And suggesting actionable fixes. Code-aware models outperform general chat
// Models here because they understand runtime semantics and framework internals.
export const ERROR_EXPLAIN_MODELS: ModelOption[] = [
  {
    ...BASE_QWEN25_CODER_7B,
    description: 'Alibaba · best default for parsing stack traces, identifying root causes, and suggesting fixes',
  },
  {
    ...BASE_GRANITE_CODE_8B,
    description: 'IBM · 125K ctx, code-specialist for multi-file error analysis with full trace context',
  },
  {
    ...BASE_PHI4_MINI,
    description: 'Microsoft · 128K ctx, strong reasoning for non-obvious error diagnostics and runtime edge cases',
  },
  {
    ...BASE_QWEN25_CODER_3B,
    description: 'Alibaba · compact code-tuned fallback with solid exception analysis for common error types',
  },
  {
    ...BASE_GRANITE_CODE_3B,
    description:
      'IBM · lightweight long-context fallback for large log dumps and multi-frame traces on low-RAM machines',
  },
]

export const DEFAULT_ERROR_EXPLAIN_MODEL = ERROR_EXPLAIN_MODELS[0].id
