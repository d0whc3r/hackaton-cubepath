import type { ModelOption } from '../types'

// ── Docstring generation ──────────────────────────────────────────────────────
// Code-specialist models for generating accurate parameter, return, and
// Module-level documentation. Code-tuned models produce better type-aware
// Docstrings because they understand function signatures and framework patterns.
export const DOCSTRING_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · best default for concise, accurate docstrings without overexplaining',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder',
    params: '3B',
    size: 1.9,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · strongest quality option when you want richer parameter and return docs',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder',
    params: '7B',
    size: 4.7,
  },
  {
    contextWindow: 131_072,
    description:
      'Mistral/All Hands · 128K ctx, agentic software-engineering model for thorough multi-param and module-level docstrings',
    id: 'devstral:24b',
    label: 'Devstral',
    params: '24B',
    size: 14,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, code-specialized fallback for larger files and broad API surfaces',
    id: 'granite-code:3b',
    label: 'Granite Code',
    params: '3B',
    size: 2,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · larger long-context option when the codebase context matters for accurate docs',
    id: 'granite-code:8b',
    label: 'Granite Code',
    params: '8B',
    size: 4.6,
  },
]

export const DEFAULT_DOCSTRING_MODEL = DOCSTRING_MODELS[0].id
