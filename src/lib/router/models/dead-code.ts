import type { ModelOption } from '../types'
import {
  BASE_DEVSTRAL_24B,
  BASE_GRANITE_CODE_3B,
  BASE_GRANITE_CODE_8B,
  BASE_QWEN25_CODER_3B,
  BASE_QWEN25_CODER_7B,
} from './shared'

// ── Dead code detection ───────────────────────────────────────────────────────
// Code-specialist models for identifying unused variables, functions, imports,
// And unreachable branches. Long context is critical to avoid false positives —
// A symbol may appear unused in one file but be exported and used in another.
export const DEAD_CODE_MODELS: ModelOption[] = [
  {
    ...BASE_GRANITE_CODE_8B,
    description: 'IBM · 125K ctx, best default for dead-code analysis across larger files and modules',
  },
  {
    ...BASE_DEVSTRAL_24B,
    description:
      'Mistral/All Hands · 128K ctx, agentic software-engineering model for comprehensive dead-code sweeps across larger codebases',
  },
  {
    ...BASE_QWEN25_CODER_7B,
    description: 'Alibaba · best targeted option when you want stronger code reasoning over long context',
  },
  {
    ...BASE_GRANITE_CODE_3B,
    description: 'IBM · lighter long-context fallback for broader unused-code sweeps on low-RAM machines',
  },
  {
    ...BASE_QWEN25_CODER_3B,
    description: 'Alibaba · budget fallback for cleanup passes on smaller files',
  },
]

export const DEFAULT_DEAD_CODE_MODEL = DEAD_CODE_MODELS[0].id
