import type { ModelOption } from '../types'

export const PERFORMANCE_HINT_MODELS: ModelOption[] = [
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, best default for performance reviews that need more whole-file context',
    id: 'granite-code:8b',
    label: 'Granite Code 8B',
    params: '8B',
    size: '4.6 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, strong reasoning fallback for optimization tradeoff analysis',
    id: 'gemma3:12b',
    label: 'Gemma 3 12B',
    params: '12B',
    size: '8.1 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · best targeted code-optimization option when the input fits comfortably in 32K',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · budget fallback for fast performance hinting on smaller snippets',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
]

export const DEFAULT_PERFORMANCE_HINT_MODEL = 'granite-code:8b'
