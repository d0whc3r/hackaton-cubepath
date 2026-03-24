import type { ModelOption } from '../types'

// ── Commit messages ───────────────────────────────────────────────────────────
// Small, fast models with strong instruction-following for structured output.
export const COMMIT_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · best default for conventional commits from real diffs with minimal RAM',
    id: 'qwen2.5-coder:1.5b',
    label: 'Qwen2.5 Coder 1.5B',
    params: '1.5B',
    size: '986 MB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · smallest diff-aware option, ideal for very fast local commit generation',
    id: 'qwen2.5-coder:0.5b',
    label: 'Qwen2.5 Coder 0.5B',
    params: '0.5B',
    size: '398 MB',
  },
  {
    contextWindow: 40_960,
    description: 'Alibaba · latest tiny general model, good fallback for terse structured commit messages',
    id: 'qwen3:0.6b',
    label: 'Qwen 3 0.6B',
    params: '0.6B',
    size: '523 MB',
  },
  {
    contextWindow: 131_072,
    description: 'IBM · 128K ctx, strong instruction following for clean one-line summaries',
    id: 'granite3.3:2b',
    label: 'Granite 3.3 2B',
    params: '2B',
    size: '1.5 GB',
  },
  {
    contextWindow: 262_144,
    description: 'Alibaba · strongest general small model when the diff needs more context to summarize well',
    id: 'qwen3:4b',
    label: 'Qwen 3 4B',
    params: '4B',
    size: '2.5 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · higher-quality option for noisy diffs, monorepos, and nuanced commit scopes',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
]

export const DEFAULT_COMMIT_MODEL = 'qwen2.5-coder:1.5b'
