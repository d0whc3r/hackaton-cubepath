import type { ModelOption } from '../types'
import {
  BASE_DEVSTRAL_24B,
  BASE_GRANITE_CODE_3B,
  BASE_GRANITE_CODE_8B,
  BASE_PHI4_MINI,
  BASE_QWEN25_CODER_14B,
  BASE_QWEN25_CODER_3B,
  BASE_QWEN25_CODER_7B,
} from './shared'

// ── Explain ───────────────────────────────────────────────────────────────────
// Code-specialist models for structured code explanation, documentation, and analysis.
// All models here are either code-fine-tuned or purpose-built for software engineering.
export const EXPLAIN_MODELS: ModelOption[] = [
  {
    ...BASE_QWEN25_CODER_7B,
    description: 'Alibaba · code-specialist default, top performer for structured code walkthroughs and API docs',
  },
  {
    ...BASE_QWEN25_CODER_14B,
    description: 'Alibaba · higher-quality code explanations with more nuanced analysis for complex systems',
  },
  {
    ...BASE_GRANITE_CODE_8B,
    description: 'IBM · 125K ctx, code-specialist for whole-file and multi-function explanations without truncation',
  },
  {
    ...BASE_DEVSTRAL_24B,
    description:
      'Mistral/All Hands · 128K ctx, agentic software-engineering model with deep code reasoning and documentation skills',
  },
  {
    ...BASE_PHI4_MINI,
    description:
      'Microsoft · 128K ctx, synthetic-trained reasoning model for clear technical prose and structured explanations',
  },
  {
    ...BASE_GRANITE_CODE_3B,
    description: 'IBM · 125K ctx, lightweight long-context fallback for budget-constrained machines',
  },
  {
    ...BASE_QWEN25_CODER_3B,
    description: 'Alibaba · compact code-tuned fallback for quick inline explanations and short snippets',
  },
]

export const DEFAULT_EXPLAIN_MODEL = EXPLAIN_MODELS[0].id
