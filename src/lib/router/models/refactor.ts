import type { ModelOption } from '../types'

// ── Refactor ─────────────────────────────────────────────────────────────────
// Code-specialist models for cleanup, idiomatic rewrites, and large-file edits.
// Long context window is critical here to handle full files without truncation.
// All models are code-fine-tuned or purpose-built for software engineering tasks.
export const REFACTOR_MODELS: ModelOption[] = [
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, best default when full-file refactors would otherwise truncate context',
    id: 'granite-code:8b',
    label: 'Granite Code',
    params: '8B',
    size: 4.6,
  },
  {
    contextWindow: 131_072,
    description:
      'Mistral/All Hands · 128K ctx, purpose-built for software engineering including whole-codebase refactoring; requires 32 GB RAM',
    id: 'devstral:24b',
    label: 'Devstral',
    params: '24B',
    size: 14,
  },
  {
    contextWindow: 163_840,
    description: 'DeepSeek · MoE architecture, 160K ctx, GPT-4 Turbo competitive on complex multi-step refactors',
    id: 'deepseek-coder-v2:16b',
    label: 'DeepSeek Coder V2',
    params: '16B',
    size: 8.9,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · best code-specialist quality under 10 GB for targeted refactors on 16 GB machines',
    id: 'qwen2.5-coder:14b',
    label: 'Qwen2.5 Coder',
    params: '14B',
    size: 9,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · excellent for focused cleanup and behavior-preserving rewrites on RAM-constrained machines',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder',
    params: '7B',
    size: 4.7,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · lighter long-context refactor fallback for constrained machines',
    id: 'granite-code:3b',
    label: 'Granite Code',
    params: '3B',
    size: 2,
  },
]

export const DEFAULT_REFACTOR_MODEL = REFACTOR_MODELS[0].id
