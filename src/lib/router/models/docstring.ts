import type { ModelOption } from '../types'
import {
  BASE_DEVSTRAL_24B,
  BASE_GRANITE_CODE_3B,
  BASE_GRANITE_CODE_8B,
  BASE_QWEN25_CODER_3B,
  BASE_QWEN25_CODER_7B,
} from './shared'

// ── Docstring generation ──────────────────────────────────────────────────────
// Code-specialist models for generating accurate parameter, return, and
// Module-level documentation. Code-tuned models produce better type-aware
// Docstrings because they understand function signatures and framework patterns.
export const DOCSTRING_MODELS: ModelOption[] = [
  {
    ...BASE_QWEN25_CODER_3B,
    description: 'Alibaba · best default for concise, accurate docstrings without overexplaining',
  },
  {
    ...BASE_QWEN25_CODER_7B,
    description: 'Alibaba · strongest quality option when you want richer parameter and return docs',
  },
  {
    ...BASE_DEVSTRAL_24B,
    description:
      'Mistral/All Hands · 128K ctx, agentic software-engineering model for thorough multi-param and module-level docstrings',
  },
  {
    ...BASE_GRANITE_CODE_3B,
    description: 'IBM · 125K ctx, code-specialized fallback for larger files and broad API surfaces',
  },
  {
    ...BASE_GRANITE_CODE_8B,
    description: 'IBM · larger long-context option when the codebase context matters for accurate docs',
  },
]

export const DEFAULT_DOCSTRING_MODEL = DOCSTRING_MODELS[0].id
