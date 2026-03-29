import type { ModelOption } from '../types'
import { BASE_GRANITE33_2B, BASE_LLAMA32_1B, BASE_PHI4_MINI, BASE_QWEN25_05B, BASE_QWEN25_15B } from './shared'

// ── Analyst (routing intelligence) ───────────────────────────────────────────
// Small, fast models optimised for structured JSON output and code classification.
// The Analyst runs before the main specialist to detect language, test framework, etc.
// Use Ollama's `format: "json"` or JSON schema parameter to enforce grammar at the
// Inference layer — this dramatically improves JSON reliability for all models below.
export const ANALYST_MODELS: ModelOption[] = [
  {
    ...BASE_QWEN25_05B,
    description: 'Alibaba · tiny but strong at structured JSON outputs and code classification',
  },
  {
    ...BASE_LLAMA32_1B,
    description: 'Meta · dependable 128K classifier when inputs contain longer snippets or diffs',
  },
  {
    ...BASE_QWEN25_15B,
    description: 'Alibaba · stronger tiny-model reasoning if you can spare a little more memory',
  },
  {
    ...BASE_GRANITE33_2B,
    description: 'IBM · 128K ctx, strong instruction following when routing prompts get more complex',
  },
  {
    ...BASE_PHI4_MINI,
    description:
      'Microsoft · 128K ctx, native function-calling support for reliable JSON schema adherence on harder routing inputs',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · higher-accuracy fallback for precise structured extraction when the schema is complex',
    id: 'qwen2.5:3b',
    label: 'Qwen 2.5',
    params: '3B',
    size: 1.9,
  },
]

export const DEFAULT_ANALYST_MODEL = ANALYST_MODELS[0].id
