import type { ModelOption } from '../types'

export const DEAD_CODE_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, best quality dead code detection',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, good quality/speed trade-off for cleanup analysis',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Microsoft · 128K ctx, reliable detection of unused symbols',
    id: 'phi3.5',
    label: 'Phi 3.5',
    params: '3.8B',
    size: '2.2 GB',
  },
  {
    contextWindow: 163_840,
    description: 'DeepSeek · highest quality dead code analysis, 160K ctx',
    id: 'deepseek-coder-v2:16b',
    label: 'DeepSeek Coder V2 16B',
    params: '16B',
    size: '9.1 GB',
  },
]

export const DEFAULT_DEAD_CODE_MODEL = 'qwen2.5-coder:7b'
