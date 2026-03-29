import type { ModelOption } from '../types'
import {
  BASE_DEEPSEEK_CODER_V2_16B,
  BASE_GRANITE_CODE_8B,
  BASE_QWEN25_CODER_15B,
  BASE_QWEN25_CODER_3B,
  BASE_QWEN25_CODER_7B,
} from './shared'

// ── Type hints ────────────────────────────────────────────────────────────────
// Code-specialist models for adding or improving type annotations and signatures.
// Code-tuned models understand type system semantics (generics, unions, narrowing)
// Far better than general chat models.
export const TYPE_HINTS_MODELS: ModelOption[] = [
  {
    ...BASE_QWEN25_CODER_7B,
    description: 'Alibaba · best default for accurate local type annotation generation',
  },
  {
    ...BASE_DEEPSEEK_CODER_V2_16B,
    description:
      'DeepSeek · MoE 16B at ~2.4B active, 160K ctx, high-quality type inference for complex generics and large files',
  },
  {
    ...BASE_GRANITE_CODE_8B,
    description: 'IBM · 125K ctx, useful when type inference depends on reading broader file context',
  },
  {
    ...BASE_QWEN25_CODER_3B,
    description: 'Alibaba · strong budget option for routine annotation passes',
  },
  {
    ...BASE_QWEN25_CODER_15B,
    description: 'Alibaba · fastest code-tuned option for simple hint insertion on short snippets',
  },
]

export const DEFAULT_TYPE_HINTS_MODEL = TYPE_HINTS_MODELS[0].id
