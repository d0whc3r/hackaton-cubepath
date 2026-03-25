import type { ModelOption } from '../types'

// ── Commit messages ───────────────────────────────────────────────────────────
// Task-specific and code-specialist models for conventional commit generation.
// Prefer purpose-built commit models first, then code-tuned models as fallbacks.
// Inputs are git diffs — code-aware models handle them better than general chat.
export const COMMIT_MODELS: ModelOption[] = [
  {
    contextWindow: 262_144,
    description:
      'tavernari · purpose-built commit-message SLM with two-stage summarise-then-write pipeline; 256K context handles monorepo diffs',
    id: 'tavernari/git-commit-message:sp_commit_mini',
    label: 'Git Commit Message Mini',
    params: '4B',
    size: 2.5,
  },
  {
    contextWindow: 40_960,
    description:
      'tavernari · full-size purpose-built commit-message model for higher-quality scope detection and nuanced messages',
    id: 'tavernari/git-commit-message',
    label: 'Git Commit Message',
    params: '8B',
    size: 5,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · best lightweight code-tuned fallback for conventional commits from diffs',
    id: 'qwen2.5-coder:1.5b',
    label: 'Qwen2.5 Coder',
    params: '1.5B',
    size: 0.986,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · smallest diff-aware option for very fast local commit generation with minimal RAM',
    id: 'qwen2.5-coder:0.5b',
    label: 'Qwen2.5 Coder',
    params: '0.5B',
    size: 0.398,
  },
  {
    contextWindow: 131_072,
    description: 'IBM · 128K ctx, strong instruction following for clean one-line summaries in CI pipelines',
    id: 'granite3.3:2b',
    label: 'Granite 3.3',
    params: '2B',
    size: 1.5,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · higher-quality fallback for noisy diffs, monorepos, and nuanced commit scopes',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder',
    params: '3B',
    size: 1.9,
  },
]

export const DEFAULT_COMMIT_MODEL = COMMIT_MODELS[0].id
