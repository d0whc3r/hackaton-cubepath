import type { ModelOption } from '../types'

// ── Error explanation ─────────────────────────────────────────────────────────
// Code-specialist models for parsing stack traces, identifying root causes,
// And suggesting actionable fixes. Code-aware models outperform general chat
// Models here because they understand runtime semantics and framework internals.
export const ERROR_EXPLAIN_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · best default for parsing stack traces, identifying root causes, and suggesting fixes',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder',
    params: '7B',
    size: 4.7,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, code-specialist for multi-file error analysis with full trace context',
    id: 'granite-code:8b',
    label: 'Granite Code',
    params: '8B',
    size: 4.6,
  },
  {
    contextWindow: 131_072,
    description: 'Microsoft · 128K ctx, strong reasoning for non-obvious error diagnostics and runtime edge cases',
    id: 'phi4-mini:3.8b',
    label: 'Phi 4 Mini',
    params: '3.8B',
    size: 2.5,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · compact code-tuned fallback with solid exception analysis for common error types',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder',
    params: '3B',
    size: 1.9,
  },
  {
    contextWindow: 128_000,
    description:
      'IBM · lightweight long-context fallback for large log dumps and multi-frame traces on low-RAM machines',
    id: 'granite-code:3b',
    label: 'Granite Code',
    params: '3B',
    size: 2,
  },
]

export const DEFAULT_ERROR_EXPLAIN_MODEL = ERROR_EXPLAIN_MODELS[0].id
