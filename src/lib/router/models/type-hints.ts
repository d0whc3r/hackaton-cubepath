import type { ModelOption } from '../types'

// ── Type hints ────────────────────────────────────────────────────────────────
// Code-specialist models for adding or improving type annotations and signatures.
// Code-tuned models understand type system semantics (generics, unions, narrowing)
// Far better than general chat models.
export const TYPE_HINTS_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · best default for accurate local type annotation generation',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder',
    params: '7B',
    size: 4.7,
  },
  {
    contextWindow: 163_840,
    description:
      'DeepSeek · MoE 16B at ~2.4B active, 160K ctx, high-quality type inference for complex generics and large files',
    id: 'deepseek-coder-v2:16b',
    label: 'DeepSeek Coder V2',
    params: '16B',
    size: 8.9,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, useful when type inference depends on reading broader file context',
    id: 'granite-code:8b',
    label: 'Granite Code',
    params: '8B',
    size: 4.6,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · strong budget option for routine annotation passes',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder',
    params: '3B',
    size: 1.9,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · fastest code-tuned option for simple hint insertion on short snippets',
    id: 'qwen2.5-coder:1.5b',
    label: 'Qwen2.5 Coder',
    params: '1.5B',
    size: 0.986,
  },
]

export const DEFAULT_TYPE_HINTS_MODEL = TYPE_HINTS_MODELS[0].id
