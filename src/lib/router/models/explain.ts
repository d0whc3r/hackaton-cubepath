import type { ModelOption } from '../types'

// ── Explain ───────────────────────────────────────────────────────────────────
// Best models for structured code explanation, documentation, and analysis.
export const EXPLAIN_MODELS: ModelOption[] = [
  {
    contextWindow: 262_144,
    description: 'Alibaba · latest general model, 256K ctx, strongest small-model default for deep explanations',
    id: 'qwen3:4b',
    label: 'Qwen 3 4B',
    params: '4B',
    size: '2.5 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, excellent clarity for code walkthroughs and docs-style explanations',
    id: 'gemma3:4b',
    label: 'Gemma 3 4B',
    params: '4B',
    size: '3.3 GB',
  },
  {
    contextWindow: 131_072,
    description: 'IBM · 128K ctx, strong instruction following and concise technical summaries',
    id: 'granite3.3:8b',
    label: 'Granite 3.3 8B',
    params: '8B',
    size: '4.9 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, strongest Gemma option for long technical explanations',
    id: 'gemma3:12b',
    label: 'Gemma 3 12B',
    params: '12B',
    size: '8.1 GB',
  },
  {
    contextWindow: 40_960,
    description: 'Alibaba · newer 8B variant, stronger reasoning when 4B feels too compact',
    id: 'qwen3:8b',
    label: 'Qwen 3 8B',
    params: '8B',
    size: '5.2 GB',
  },
  {
    contextWindow: 40_960,
    description: 'Alibaba · best high-end small general model under 10 GB for explanation-heavy work',
    id: 'qwen3:14b',
    label: 'Qwen 3 14B',
    params: '14B',
    size: '9.3 GB',
  },
  {
    contextWindow: 16_384,
    description: 'Microsoft · still strong for dense reasoning, but shorter context than newer options',
    id: 'phi4',
    label: 'Phi 4',
    params: '14B',
    size: '9.1 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · older but reliable fallback with strong instruction following and JSON handling',
    id: 'qwen2.5:7b',
    label: 'Qwen 2.5 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Meta · compact 128K fallback for plain-language explanations on low-RAM machines',
    id: 'llama3.2:3b',
    label: 'Llama 3.2 3B',
    params: '3B',
    size: '2.0 GB',
  },
]

export const DEFAULT_EXPLAIN_MODEL = 'qwen3:4b'
