import type { ModelOption } from '../types'
import { BASE_DEEPSEEK_CODER_V2_16B, BASE_GRANITE_CODE_8B, BASE_QWEN25_CODER_3B, BASE_QWEN25_CODER_7B } from './shared'

// ── Performance hints ─────────────────────────────────────────────────────────
// Code-specialist models for identifying bottlenecks, inefficient algorithms,
// And suggesting targeted optimisations. Long context is important to read
// Surrounding code and understand the hot path before suggesting changes.
export const PERFORMANCE_HINT_MODELS: ModelOption[] = [
  {
    ...BASE_GRANITE_CODE_8B,
    description:
      'IBM · 125K ctx, best default for performance reviews that need whole-file context to reason about the hot path',
  },
  {
    ...BASE_DEEPSEEK_CODER_V2_16B,
    description:
      'DeepSeek · MoE 16B at ~2.4B active params, 160K ctx, excellent for identifying algorithmic bottlenecks across large files',
  },
  {
    ...BASE_QWEN25_CODER_7B,
    description: 'Alibaba · best targeted code-optimization option when the input fits comfortably in 32K',
  },
  {
    ...BASE_QWEN25_CODER_3B,
    description: 'Alibaba · budget fallback for fast performance hinting on smaller snippets',
  },
]

export const DEFAULT_PERFORMANCE_HINT_MODEL = PERFORMANCE_HINT_MODELS[0].id
