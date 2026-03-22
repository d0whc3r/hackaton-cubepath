import type { ModelOption } from '../types'

export const NAMING_HELPER_MODELS: ModelOption[] = [
  {
    contextWindow: 131_072,
    description: 'Microsoft · 128K ctx, best instruction adherence for structured list output',
    id: 'phi3.5',
    label: 'Phi 3.5',
    params: '3.8B',
    size: '2.2 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, strong instruction following for rename suggestions',
    id: 'gemma3:4b',
    label: 'Gemma 3 4B',
    params: '4B',
    size: '3.0 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Meta · good instruction following, plain-language rationale, 128K ctx',
    id: 'llama3.2:3b',
    label: 'Llama 3.2 3B',
    params: '3B',
    size: '2.0 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Alibaba · 128K ctx, strong reasoning for naming conventions',
    id: 'qwen2.5:3b',
    label: 'Qwen 2.5 3B',
    params: '3B',
    size: '1.9 GB',
  },
]

export const DEFAULT_NAMING_HELPER_MODEL = 'phi3.5'
