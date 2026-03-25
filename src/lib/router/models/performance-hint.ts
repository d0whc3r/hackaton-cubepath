import type { ModelOption } from '../types'

// ── Performance hints ─────────────────────────────────────────────────────────
// Code-specialist models for identifying bottlenecks, inefficient algorithms,
// And suggesting targeted optimisations. Long context is important to read
// Surrounding code and understand the hot path before suggesting changes.
export const PERFORMANCE_HINT_MODELS: ModelOption[] = [
  {
    contextWindow: 128_000,
    description:
      'IBM · 125K ctx, best default for performance reviews that need whole-file context to reason about the hot path',
    id: 'granite-code:8b',
    label: 'Granite Code',
    params: '8B',
    size: 4.6,
  },
  {
    contextWindow: 163_840,
    description:
      'DeepSeek · MoE 16B at ~2.4B active params, 160K ctx, excellent for identifying algorithmic bottlenecks across large files',
    id: 'deepseek-coder-v2:16b',
    label: 'DeepSeek Coder V2',
    params: '16B',
    size: 8.9,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · best targeted code-optimization option when the input fits comfortably in 32K',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder',
    params: '7B',
    size: 4.7,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · budget fallback for fast performance hinting on smaller snippets',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder',
    params: '3B',
    size: 1.9,
  },
]

export const DEFAULT_PERFORMANCE_HINT_MODEL = PERFORMANCE_HINT_MODELS[0].id
