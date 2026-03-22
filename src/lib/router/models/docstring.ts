import type { ModelOption } from '../types'

export const DOCSTRING_MODELS: ModelOption[] = [
  {
    contextWindow: 131_072,
    description: 'Microsoft · 128K ctx, best instruction adherence for structured output',
    id: 'phi3.5',
    label: 'Phi 3.5',
    params: '3.8B',
    size: '2.2 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, best quality code documentation generation',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, good quality/speed trade-off for docstrings',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, strong instruction following for documentation',
    id: 'gemma3:4b',
    label: 'Gemma 3 4B',
    params: '4B',
    size: '3.0 GB',
  },
]

export const DEFAULT_DOCSTRING_MODEL = 'phi3.5'
