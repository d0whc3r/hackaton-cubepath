import type { ModelOption } from '../types'

// ── Analyst (routing intelligence) ───────────────────────────────────────────
// Small, fast models optimised for structured JSON output and code classification.
// The Analyst runs before the main specialist to detect language, test framework, etc.
// Use Ollama's `format: "json"` or JSON schema parameter to enforce grammar at the
// Inference layer — this dramatically improves JSON reliability for all models below.
export const ANALYST_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · tiny but strong at structured JSON outputs and code classification',
    id: 'qwen2.5:0.5b',
    label: 'Qwen 2.5',
    params: '0.5B',
    size: 0.398,
  },
  {
    contextWindow: 131_072,
    description: 'Meta · dependable 128K classifier when inputs contain longer snippets or diffs',
    id: 'llama3.2:1b',
    label: 'Llama 3.2',
    params: '1B',
    size: 1.3,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · stronger tiny-model reasoning if you can spare a little more memory',
    id: 'qwen2.5:1.5b',
    label: 'Qwen 2.5',
    params: '1.5B',
    size: 0.986,
  },
  {
    contextWindow: 131_072,
    description: 'IBM · 128K ctx, strong instruction following when routing prompts get more complex',
    id: 'granite3.3:2b',
    label: 'Granite 3.3',
    params: '2B',
    size: 1.5,
  },
  {
    contextWindow: 131_072,
    description:
      'Microsoft · 128K ctx, native function-calling support for reliable JSON schema adherence on harder routing inputs',
    id: 'phi4-mini:3.8b',
    label: 'Phi 4 Mini',
    params: '3.8B',
    size: 2.5,
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
