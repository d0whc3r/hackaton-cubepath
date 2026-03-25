import type { ModelOption } from '../types'

// ── Naming helper ─────────────────────────────────────────────────────────────
// Code-specialist models for convention-aware rename suggestions. Code-tuned
// Models understand naming patterns (camelCase, snake_case, domain prefixes)
// From their training corpus better than general chat models.
export const NAMING_HELPER_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · code-specialist default for convention-aware rename suggestions in context',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder',
    params: '3B',
    size: 1.9,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · higher-quality naming for complex APIs and domain-specific identifiers',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder',
    params: '7B',
    size: 4.7,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, useful when naming depends on reading broader surrounding file context',
    id: 'granite-code:8b',
    label: 'Granite Code',
    params: '8B',
    size: 4.6,
  },
  {
    contextWindow: 131_072,
    description: 'Microsoft · 128K ctx, strong instruction following for well-formatted rename candidate lists',
    id: 'phi4-mini:3.8b',
    label: 'Phi 4 Mini',
    params: '3.8B',
    size: 2.5,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · compact long-context fallback for reading broader context on low-RAM machines',
    id: 'granite-code:3b',
    label: 'Granite Code',
    params: '3B',
    size: 2,
  },
]

export const DEFAULT_NAMING_HELPER_MODEL = NAMING_HELPER_MODELS[0].id
