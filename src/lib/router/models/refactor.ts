import type { ModelOption } from '../types'

// ── Refactor ─────────────────────────────────────────────────────────────────
// Models that excel at code cleanup, idiomatic rewrites, and large-file edits.
// Long context window is critical here to handle full files without truncation.
export const REFACTOR_MODELS: ModelOption[] = [
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, best default when full-file refactors would otherwise truncate context',
    id: 'granite-code:8b',
    label: 'Granite Code 8B',
    params: '8B',
    size: '4.6 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · best code-specialist quality under 10 GB for targeted refactors',
    id: 'qwen2.5-coder:14b',
    label: 'Qwen2.5 Coder 14B',
    params: '14B',
    size: '9.0 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · still excellent for focused cleanup and behavior-preserving rewrites',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 262_144,
    description: 'Alibaba · 256K ctx and stronger modern reasoning, useful for repository-scale refactor prompts',
    id: 'qwen3:4b',
    label: 'Qwen 3 4B',
    params: '4B',
    size: '2.5 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, strong hybrid option for structural refactors with detailed rationale',
    id: 'gemma3:12b',
    label: 'Gemma 3 12B',
    params: '12B',
    size: '8.1 GB',
  },
  {
    contextWindow: 128_000,
    description: 'IBM · lighter long-context refactor fallback for constrained machines',
    id: 'granite-code:3b',
    label: 'Granite Code 3B',
    params: '3B',
    size: '2.0 GB',
  },
  {
    contextWindow: 16_384,
    description: 'HuggingFace · legacy fallback with good idiomatic patterns across many languages',
    id: 'starcoder2:7b',
    label: 'StarCoder2 7B',
    params: '7B',
    size: '4.0 GB',
  },
]

export const DEFAULT_REFACTOR_MODEL = 'granite-code:8b'
