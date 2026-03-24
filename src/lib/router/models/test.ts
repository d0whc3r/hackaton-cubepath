import type { ModelOption } from '../types'

// ── Test generation ───────────────────────────────────────────────────────────
// Code-specialist models best at generating comprehensive test suites.
export const TEST_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · strongest default for unit-test generation on practical local hardware',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · best high-quality local option under 10 GB for harder test suites',
    id: 'qwen2.5-coder:14b',
    label: 'Qwen2.5 Coder 14B',
    params: '14B',
    size: '9.0 GB',
  },
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, code-specialized option for larger files and broader test context',
    id: 'granite-code:8b',
    label: 'Granite Code 8B',
    params: '8B',
    size: '4.6 GB',
  },
  {
    contextWindow: 128_000,
    description: 'IBM · lighter long-context fallback for generating tests across larger snippets',
    id: 'granite-code:3b',
    label: 'Granite Code 3B',
    params: '3B',
    size: '2.0 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, useful when edge-case reasoning matters more than code specialization',
    id: 'gemma3:12b',
    label: 'Gemma 3 12B',
    params: '12B',
    size: '8.1 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · best budget option when you still want code-tuned test generation',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
  {
    contextWindow: 16_384,
    description: 'HuggingFace · still useful as a legacy multi-language code fallback',
    id: 'starcoder2:7b',
    label: 'StarCoder2 7B',
    params: '7B',
    size: '4.0 GB',
  },
]

export const DEFAULT_TEST_MODEL = 'qwen2.5-coder:7b'
