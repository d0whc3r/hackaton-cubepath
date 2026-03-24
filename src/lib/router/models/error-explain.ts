import type { ModelOption } from '../types'

export const ERROR_EXPLAIN_MODELS: ModelOption[] = [
  {
    contextWindow: 262_144,
    description: 'Alibaba · latest 4B default, strong root-cause explanations with long stack traces',
    id: 'qwen3:4b',
    label: 'Qwen 3 4B',
    params: '4B',
    size: '2.5 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, clear user-facing explanations for errors and warnings',
    id: 'gemma3:4b',
    label: 'Gemma 3 4B',
    params: '4B',
    size: '3.3 GB',
  },
  {
    contextWindow: 131_072,
    description: 'IBM · 128K ctx, efficient option for concise issue explanations and remediation steps',
    id: 'granite3.3:2b',
    label: 'Granite 3.3 2B',
    params: '2B',
    size: '1.5 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · compact fallback with good reasoning for exception analysis',
    id: 'qwen2.5:3b',
    label: 'Qwen 2.5 3B',
    params: '3B',
    size: '1.9 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Meta · plain-language fallback that stays readable for non-expert users',
    id: 'llama3.2:3b',
    label: 'Llama 3.2 3B',
    params: '3B',
    size: '2.0 GB',
  },
]

export const DEFAULT_ERROR_EXPLAIN_MODEL = 'qwen3:4b'
