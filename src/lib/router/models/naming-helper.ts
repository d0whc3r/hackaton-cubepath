import type { ModelOption } from '../types'
import {
  BASE_GRANITE_CODE_3B,
  BASE_GRANITE_CODE_8B,
  BASE_PHI4_MINI,
  BASE_QWEN25_CODER_3B,
  BASE_QWEN25_CODER_7B,
} from './shared'

// ── Naming helper ─────────────────────────────────────────────────────────────
// Code-specialist models for convention-aware rename suggestions. Code-tuned
// Models understand naming patterns (camelCase, snake_case, domain prefixes)
// From their training corpus better than general chat models.
export const NAMING_HELPER_MODELS: ModelOption[] = [
  {
    ...BASE_QWEN25_CODER_3B,
    description: 'Alibaba · code-specialist default for convention-aware rename suggestions in context',
  },
  {
    ...BASE_QWEN25_CODER_7B,
    description: 'Alibaba · higher-quality naming for complex APIs and domain-specific identifiers',
  },
  {
    ...BASE_GRANITE_CODE_8B,
    description: 'IBM · 125K ctx, useful when naming depends on reading broader surrounding file context',
  },
  {
    ...BASE_PHI4_MINI,
    description: 'Microsoft · 128K ctx, strong instruction following for well-formatted rename candidate lists',
  },
  {
    ...BASE_GRANITE_CODE_3B,
    description: 'IBM · compact long-context fallback for reading broader context on low-RAM machines',
  },
]

export const DEFAULT_NAMING_HELPER_MODEL = NAMING_HELPER_MODELS[0].id
