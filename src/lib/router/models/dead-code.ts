import type { ModelOption } from '../types'

// ── Dead code detection ───────────────────────────────────────────────────────
// Code-specialist models for identifying unused variables, functions, imports,
// And unreachable branches. Long context is critical to avoid false positives —
// A symbol may appear unused in one file but be exported and used in another.
export const DEAD_CODE_MODELS: ModelOption[] = [
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, best default for dead-code analysis across larger files and modules',
    id: 'granite-code:8b',
    label: 'Granite Code',
    params: '8B',
    size: 4.6,
  },
  {
    contextWindow: 131_072,
    description:
      'Mistral/All Hands · 128K ctx, agentic software-engineering model for comprehensive dead-code sweeps across larger codebases',
    id: 'devstral:24b',
    label: 'Devstral',
    params: '24B',
    size: 14,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · best targeted option when you want stronger code reasoning over long context',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder',
    params: '7B',
    size: 4.7,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · lighter long-context fallback for broader unused-code sweeps on low-RAM machines',
    id: 'granite-code:3b',
    label: 'Granite Code',
    params: '3B',
    size: 2,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · budget fallback for cleanup passes on smaller files',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder',
    params: '3B',
    size: 1.9,
  },
]

export const DEFAULT_DEAD_CODE_MODEL = DEAD_CODE_MODELS[0].id
