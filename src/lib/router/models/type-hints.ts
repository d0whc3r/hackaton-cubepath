import type { ModelOption } from '../types'

export const TYPE_HINTS_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, best quality type annotation generation',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, good quality/speed trade-off for type hints',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · sub-1GB, fastest option for simple type annotation tasks',
    id: 'qwen2.5-coder:1.5b',
    label: 'Qwen2.5 Coder 1.5B',
    params: '1.5B',
    size: '986 MB',
  },
  {
    contextWindow: 163_840,
    description: 'DeepSeek · highest quality type inference, 160K ctx',
    id: 'deepseek-coder-v2:16b',
    label: 'DeepSeek Coder V2 16B',
    params: '16B',
    size: '9.1 GB',
  },
]

export const DEFAULT_TYPE_HINTS_MODEL = 'qwen2.5-coder:7b'
