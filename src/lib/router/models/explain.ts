import type { ModelOption } from '../types'

// ── Explain ───────────────────────────────────────────────────────────────────
// Code-specialist models for structured code explanation, documentation, and analysis.
// All models here are either code-fine-tuned or purpose-built for software engineering.
export const EXPLAIN_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · code-specialist default, top performer for structured code walkthroughs and API docs',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder',
    params: '7B',
    size: 4.7,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · higher-quality code explanations with more nuanced analysis for complex systems',
    id: 'qwen2.5-coder:14b',
    label: 'Qwen2.5 Coder',
    params: '14B',
    size: 9,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, code-specialist for whole-file and multi-function explanations without truncation',
    id: 'granite-code:8b',
    label: 'Granite Code',
    params: '8B',
    size: 4.6,
  },
  {
    contextWindow: 131_072,
    description:
      'Mistral/All Hands · 128K ctx, agentic software-engineering model with deep code reasoning and documentation skills',
    id: 'devstral:24b',
    label: 'Devstral',
    params: '24B',
    size: 14,
  },
  {
    contextWindow: 131_072,
    description:
      'Microsoft · 128K ctx, synthetic-trained reasoning model for clear technical prose and structured explanations',
    id: 'phi4-mini:3.8b',
    label: 'Phi 4 Mini',
    params: '3.8B',
    size: 2.5,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, lightweight long-context fallback for budget-constrained machines',
    id: 'granite-code:3b',
    label: 'Granite Code',
    params: '3B',
    size: 2,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · compact code-tuned fallback for quick inline explanations and short snippets',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder',
    params: '3B',
    size: 1.9,
  },
]

export const DEFAULT_EXPLAIN_MODEL = EXPLAIN_MODELS[0].id
