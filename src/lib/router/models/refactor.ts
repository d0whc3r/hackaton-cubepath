import type { ModelOption } from '../types'
import {
  BASE_DEEPSEEK_CODER_V2_16B,
  BASE_DEVSTRAL_24B,
  BASE_GRANITE_CODE_3B,
  BASE_GRANITE_CODE_8B,
  BASE_QWEN25_CODER_14B,
  BASE_QWEN25_CODER_7B,
} from './shared'

// ── Refactor ─────────────────────────────────────────────────────────────────
// Code-specialist models for cleanup, idiomatic rewrites, and large-file edits.
// Long context window is critical here to handle full files without truncation.
// All models are code-fine-tuned or purpose-built for software engineering tasks.
export const REFACTOR_MODELS: ModelOption[] = [
  {
    ...BASE_GRANITE_CODE_8B,
    description: 'IBM · 125K ctx, best default when full-file refactors would otherwise truncate context',
  },
  {
    ...BASE_DEVSTRAL_24B,
    description:
      'Mistral/All Hands · 128K ctx, purpose-built for software engineering including whole-codebase refactoring; requires 32 GB RAM',
  },
  {
    ...BASE_DEEPSEEK_CODER_V2_16B,
    description: 'DeepSeek · MoE architecture, 160K ctx, GPT-4 Turbo competitive on complex multi-step refactors',
  },
  {
    ...BASE_QWEN25_CODER_14B,
    description: 'Alibaba · best code-specialist quality under 10 GB for targeted refactors on 16 GB machines',
  },
  {
    ...BASE_QWEN25_CODER_7B,
    description: 'Alibaba · excellent for focused cleanup and behavior-preserving rewrites on RAM-constrained machines',
  },
  {
    ...BASE_GRANITE_CODE_3B,
    description: 'IBM · lighter long-context refactor fallback for constrained machines',
  },
]

export const DEFAULT_REFACTOR_MODEL = REFACTOR_MODELS[0].id
