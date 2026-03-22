import type { ModelOption } from '../types'

// ── Analyst (routing intelligence) ───────────────────────────────────────────
// Small, fast models optimised for structured JSON output and code classification.
// The Analyst runs before the main specialist to detect language, test framework, etc.
export const ANALYST_MODELS: ModelOption[] = [
  {
    contextWindow: 131_072,
    description: 'Meta · ultra-fast, reliable JSON output, best analyst default',
    id: 'llama3.2:1b',
    label: 'Llama 3.2 1B',
    params: '1B',
    size: '1.3 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · sub-400MB, excellent for simple classification tasks',
    id: 'qwen2.5:0.5b',
    label: 'Qwen 2.5 0.5B',
    params: '0.5B',
    size: '397 MB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · sub-1GB, strong reasoning for a tiny model',
    id: 'qwen2.5:1.5b',
    label: 'Qwen 2.5 1.5B',
    params: '1.5B',
    size: '986 MB',
  },
  {
    contextWindow: 131_072,
    description: 'Meta · good instruction following, more accurate than 1B',
    id: 'llama3.2:3b',
    label: 'Llama 3.2 3B',
    params: '3B',
    size: '2.0 GB',
  },
  {
    contextWindow: 8192,
    description: 'HuggingFace · designed for on-device tasks, very low latency',
    id: 'smollm2:1.7b',
    label: 'SmolLM2 1.7B',
    params: '1.7B',
    size: '1.0 GB',
  },
  {
    contextWindow: 8192,
    description: 'HuggingFace · smallest option (~230MB), fastest possible routing',
    id: 'smollm2:360m',
    label: 'SmolLM2 360M',
    params: '360M',
    size: '230 MB',
  },
  {
    contextWindow: 131_072,
    description: 'Microsoft · 128K ctx, highest accuracy analyst if speed is not critical',
    id: 'phi3.5',
    label: 'Phi 3.5',
    params: '3.8B',
    size: '2.2 GB',
  },
]

export const DEFAULT_ANALYST_MODEL = 'llama3.2:1b'
