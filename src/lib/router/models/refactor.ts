import type { ModelOption } from '../types'

// ── Refactor ─────────────────────────────────────────────────────────────────
// Models that excel at code cleanup, idiomatic rewrites, and large-file edits.
// Long context window is critical here to handle full files without truncation.
export const REFACTOR_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, best balance of quality and speed for refactoring',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Alibaba · 128K ctx, top quality for complex multi-function refactors',
    id: 'qwen2.5-coder:14b',
    label: 'Qwen2.5 Coder 14B',
    params: '14B',
    size: '9.0 GB',
  },
  {
    contextWindow: 163_840,
    description: 'DeepSeek · 160K ctx, MoE runs fast, comparable to GPT-4 Turbo on code',
    id: 'deepseek-coder-v2:16b',
    label: 'DeepSeek Coder V2 16B',
    params: '16B (MoE)',
    size: '8.9 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, strong code + reasoning hybrid, great for structural refactors',
    id: 'gemma3:12b',
    label: 'Gemma 3 12B',
    params: '12B',
    size: '8.1 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Mistral+AllHands · 128K ctx, 68% SWE-bench, best agentic multi-file refactoring (needs 32GB RAM)',
    id: 'devstral:24b',
    label: 'Devstral 24B',
    params: '24B',
    size: '14 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, fast, preserves behavior well for targeted refactors',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
  {
    contextWindow: 16_384,
    description: 'HuggingFace · outperforms DeepSeek-33B on code reasoning, idiomatic patterns',
    id: 'starcoder2:15b',
    label: 'StarCoder2 15B',
    params: '15B',
    size: '9.1 GB',
  },
  {
    contextWindow: 16_384,
    description: 'HuggingFace · idiomatic patterns, 80+ languages, good structural understanding',
    id: 'starcoder2:7b',
    label: 'StarCoder2 7B',
    params: '7B',
    size: '4.0 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, lightweight option for simple cleanup tasks',
    id: 'gemma3:4b',
    label: 'Gemma 3 4B',
    params: '4B',
    size: '3.0 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Mistral AI · good at explaining refactoring decisions, 32K ctx',
    id: 'mistral:7b-instruct',
    label: 'Mistral 7B',
    params: '7B',
    size: '4.4 GB',
  },
  {
    contextWindow: 16_384,
    description: 'Meta · reliable for complex refactors, broad language support (legacy)',
    id: 'codellama:13b',
    label: 'CodeLlama 13B',
    params: '13B',
    size: '7.4 GB',
  },
]

export const DEFAULT_REFACTOR_MODEL = 'qwen2.5-coder:7b'
