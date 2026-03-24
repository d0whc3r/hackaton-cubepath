import type { ModelOption } from '../types'

export const TYPE_HINTS_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · best default for accurate local type annotation generation',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, useful when type inference depends on broader file context',
    id: 'granite-code:8b',
    label: 'Granite Code 8B',
    params: '8B',
    size: '4.6 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · strong budget option for routine annotation passes',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · fastest code-tuned option for simple hint insertion',
    id: 'qwen2.5-coder:1.5b',
    label: 'Qwen2.5 Coder 1.5B',
    params: '1.5B',
    size: '986 MB',
  },
]

export const DEFAULT_TYPE_HINTS_MODEL = 'qwen2.5-coder:7b'
