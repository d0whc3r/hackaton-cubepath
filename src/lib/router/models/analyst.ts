import type { ModelOption } from '../types'

// ── Analyst (routing intelligence) ───────────────────────────────────────────
// Small, fast models optimised for structured JSON output and code classification.
// The Analyst runs before the main specialist to detect language, test framework, etc.
export const ANALYST_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · tiny but strong at structured outputs and JSON classification',
    id: 'qwen2.5:0.5b',
    label: 'Qwen 2.5 0.5B',
    params: '0.5B',
    size: '398 MB',
  },
  {
    contextWindow: 40_960,
    description: 'Alibaba · newer tiny fallback with better general reasoning for routing edge cases',
    id: 'qwen3:0.6b',
    label: 'Qwen 3 0.6B',
    params: '0.6B',
    size: '523 MB',
  },
  {
    contextWindow: 131_072,
    description: 'Meta · dependable 128K classifier when inputs contain longer snippets or diffs',
    id: 'llama3.2:1b',
    label: 'Llama 3.2 1B',
    params: '1B',
    size: '1.3 GB',
  },
  {
    contextWindow: 131_072,
    description: 'IBM · 128K ctx, strong instruction following when routing prompts get more complex',
    id: 'granite3.3:2b',
    label: 'Granite 3.3 2B',
    params: '2B',
    size: '1.5 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · stronger tiny-model reasoning if you can spare a little more memory',
    id: 'qwen2.5:1.5b',
    label: 'Qwen 2.5 1.5B',
    params: '1.5B',
    size: '986 MB',
  },
  {
    contextWindow: 40_960,
    description: 'Alibaba · newer 1.7B option for harder multi-signal routing decisions',
    id: 'qwen3:1.7b',
    label: 'Qwen 3 1.7B',
    params: '1.7B',
    size: '1.4 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · higher-accuracy fallback for cases where precise structured extraction matters most',
    id: 'qwen2.5:3b',
    label: 'Qwen 2.5 3B',
    params: '3B',
    size: '1.9 GB',
  },
]

export const DEFAULT_ANALYST_MODEL = 'qwen2.5:0.5b'
