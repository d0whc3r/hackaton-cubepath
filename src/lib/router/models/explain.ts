import type { ModelOption } from '../types'

// ── Explain ───────────────────────────────────────────────────────────────────
// Best models for structured code explanation, documentation, and analysis.
export const EXPLAIN_MODELS: ModelOption[] = [
  {
    contextWindow: 131_072,
    description: 'Microsoft · 128K ctx, excellent structured explanations, low RAM',
    id: 'phi3.5',
    label: 'Phi 3.5',
    params: '3.8B',
    size: '2.2 GB',
  },
  {
    contextWindow: 16_384,
    description: 'Microsoft · best-in-class reasoning at 14B, rivals much larger models',
    id: 'phi4',
    label: 'Phi 4',
    params: '14B',
    size: '9.1 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, 12T token training, strong structured reasoning',
    id: 'gemma3:4b',
    label: 'Gemma 3 4B',
    params: '4B',
    size: '3.0 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, best Gemma for code + explanation hybrid tasks',
    id: 'gemma3:12b',
    label: 'Gemma 3 12B',
    params: '12B',
    size: '8.1 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, excellent clarity and depth for code analysis',
    id: 'qwen2.5:7b',
    label: 'Qwen 2.5 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · strong reasoning, good code understanding',
    id: 'qwen2.5:3b',
    label: 'Qwen 2.5 3B',
    params: '3B',
    size: '2.0 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Meta · well-rounded, fast inference, 128K ctx',
    id: 'llama3.2:3b',
    label: 'Llama 3.2 3B',
    params: '3B',
    size: '2.0 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Meta · ultra-fast, minimal RAM usage, 128K ctx',
    id: 'llama3.2:1b',
    label: 'Llama 3.2 1B',
    params: '1B',
    size: '1.3 GB',
  },
  {
    contextWindow: 8192,
    description: 'Google · high quality, strong reasoning (prev. gen)',
    id: 'gemma2:9b',
    label: 'Gemma 2 9B',
    params: '9B',
    size: '5.4 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Mistral AI · 32K ctx, detailed structured answers',
    id: 'mistral:7b-instruct',
    label: 'Mistral 7B',
    params: '7B',
    size: '4.4 GB',
  },
]

export const DEFAULT_EXPLAIN_MODEL = 'phi3.5'
