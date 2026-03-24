import type { ModelOption } from '../types'

export const NAMING_HELPER_MODELS: ModelOption[] = [
  {
    contextWindow: 262_144,
    description: 'Alibaba · best default for semantic rename suggestions with long surrounding context',
    id: 'qwen3:4b',
    label: 'Qwen 3 4B',
    params: '4B',
    size: '2.5 GB',
  },
  {
    contextWindow: 131_072,
    description: 'IBM · compact naming fallback with strong instruction following and list formatting',
    id: 'granite3.3:2b',
    label: 'Granite 3.3 2B',
    params: '2B',
    size: '1.5 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, strong at user-friendly rationale for naming choices',
    id: 'gemma3:4b',
    label: 'Gemma 3 4B',
    params: '4B',
    size: '3.3 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · reliable fallback when you want convention-aware rename suggestions',
    id: 'qwen2.5:3b',
    label: 'Qwen 2.5 3B',
    params: '3B',
    size: '1.9 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Meta · plain-language fallback for low-RAM naming and API label work',
    id: 'llama3.2:3b',
    label: 'Llama 3.2 3B',
    params: '3B',
    size: '2.0 GB',
  },
]

export const DEFAULT_NAMING_HELPER_MODEL = 'qwen3:4b'
