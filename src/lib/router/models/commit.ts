import type { ModelOption } from '../types'

// ── Commit messages ───────────────────────────────────────────────────────────
// Small, fast models with strong instruction-following for structured output.
export const COMMIT_MODELS: ModelOption[] = [
  {
    contextWindow: 131_072,
    description: 'Microsoft · 128K ctx, best instruction adherence for structured short output',
    id: 'phi3.5',
    label: 'Phi 3.5',
    params: '3.8B',
    size: '2.2 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, understands diffs very well, nuanced messages',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, best quality commit messages from complex diffs',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · sub-400MB, fastest possible diff-to-commit, great for CI',
    id: 'qwen2.5-coder:0.5b',
    label: 'Qwen2.5 Coder 0.5B',
    params: '0.5B',
    size: '398 MB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · sub-1GB, excellent quality/speed trade-off for commit messages',
    id: 'qwen2.5-coder:1.5b',
    label: 'Qwen2.5 Coder 1.5B',
    params: '1.5B',
    size: '986 MB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, strong instruction following, concise structured output',
    id: 'gemma3:4b',
    label: 'Gemma 3 4B',
    params: '4B',
    size: '3.0 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Meta · good instruction following, concise output, 128K ctx',
    id: 'llama3.2:3b',
    label: 'Llama 3.2 3B',
    params: '3B',
    size: '2.0 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Meta · fastest option, still solid quality for short messages, 128K ctx',
    id: 'llama3.2:1b',
    label: 'Llama 3.2 1B',
    params: '1B',
    size: '1.3 GB',
  },
  {
    contextWindow: 16_384,
    description: 'HuggingFace · code-aware, reads diffs naturally',
    id: 'starcoder2:3b',
    label: 'StarCoder2 3B',
    params: '3B',
    size: '1.7 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Mistral AI · highest quality if resources allow, 32K ctx',
    id: 'mistral:7b-instruct',
    label: 'Mistral 7B',
    params: '7B',
    size: '4.4 GB',
  },
]

export const DEFAULT_COMMIT_MODEL = 'phi3.5'
