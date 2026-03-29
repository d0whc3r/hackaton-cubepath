import type { ModelOption } from '../types'
import { BASE_GRANITE33_2B, BASE_QWEN25_CODER_05B, BASE_QWEN25_CODER_15B, BASE_QWEN25_CODER_3B } from './shared'

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
    ...BASE_QWEN25_CODER_15B,
    description: 'Alibaba · best lightweight code-tuned fallback for conventional commits from diffs',
  },
  {
    ...BASE_QWEN25_CODER_05B,
    description: 'Alibaba · smallest diff-aware option for very fast local commit generation with minimal RAM',
  },
  {
    ...BASE_GRANITE33_2B,
    description: 'IBM · 128K ctx, strong instruction following for clean one-line summaries in CI pipelines',
  },
  {
    ...BASE_QWEN25_CODER_3B,
    description: 'Alibaba · higher-quality fallback for noisy diffs, monorepos, and nuanced commit scopes',
  },
]

export const DEFAULT_COMMIT_MODEL = COMMIT_MODELS[0].id
