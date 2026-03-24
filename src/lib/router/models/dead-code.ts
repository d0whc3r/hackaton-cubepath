import type { ModelOption } from '../types'

export const DEAD_CODE_MODELS: ModelOption[] = [
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, best default for dead-code analysis across larger files and modules',
    id: 'granite-code:8b',
    label: 'Granite Code 8B',
    params: '8B',
    size: '4.6 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · best targeted option when you want stronger code reasoning over long context',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 128_000,
    description: 'IBM · lighter long-context fallback for broader unused-code sweeps',
    id: 'granite-code:3b',
    label: 'Granite Code 3B',
    params: '3B',
    size: '2.0 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · budget fallback for cleanup passes on smaller files',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
]

export const DEFAULT_DEAD_CODE_MODEL = 'granite-code:8b'
