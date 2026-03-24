import type { ModelOption } from '../types'

export const DOCSTRING_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · best default for concise, accurate docstrings without overexplaining',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · strongest quality option when you want richer parameter and return docs',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, code-specialized fallback for larger files and API surfaces',
    id: 'granite-code:3b',
    label: 'Granite Code 3B',
    params: '3B',
    size: '2.0 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, strong prose quality when documentation tone matters',
    id: 'gemma3:4b',
    label: 'Gemma 3 4B',
    params: '4B',
    size: '3.3 GB',
  },
  {
    contextWindow: 262_144,
    description: 'Alibaba · newer general fallback, useful for long-context documentation prompts',
    id: 'qwen3:4b',
    label: 'Qwen 3 4B',
    params: '4B',
    size: '2.5 GB',
  },
]

export const DEFAULT_DOCSTRING_MODEL = 'qwen2.5-coder:3b'
