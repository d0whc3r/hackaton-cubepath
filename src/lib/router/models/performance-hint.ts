import type { ModelOption } from '../types'

export const PERFORMANCE_HINT_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, best quality performance analysis',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 163_840,
    description: 'DeepSeek · highest quality optimization suggestions, 160K ctx',
    id: 'deepseek-coder-v2:16b',
    label: 'DeepSeek Coder V2 16B',
    params: '16B',
    size: '9.1 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, strong reasoning for performance analysis',
    id: 'gemma3:12b',
    label: 'Gemma 3 12B',
    params: '12B',
    size: '8.1 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, good quality/speed trade-off for hints',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
]

export const DEFAULT_PERFORMANCE_HINT_MODEL = 'qwen2.5-coder:7b'
