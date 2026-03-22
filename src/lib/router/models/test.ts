import type { ModelOption } from '../types'

// ── Test generation ───────────────────────────────────────────────────────────
// Code-specialist models best at generating comprehensive test suites.
export const TEST_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, current SOTA for ≤8GB VRAM, HumanEval leader',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder 7B',
    params: '7B',
    size: '4.7 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Alibaba · 128K ctx, GPT-4o-competitive on EvalPlus, needs 16GB RAM',
    id: 'qwen2.5-coder:14b',
    label: 'Qwen2.5 Coder 14B',
    params: '14B',
    size: '9.0 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · 32K ctx, fast inference, great test quality on limited hardware',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder 3B',
    params: '3B',
    size: '1.9 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, improved HumanEval vs Gemma 2, code + reasoning',
    id: 'gemma3:12b',
    label: 'Gemma 3 12B',
    params: '12B',
    size: '8.1 GB',
  },
  {
    contextWindow: 131_072,
    description: 'Google · 128K ctx, strong reasoning for test edge-case detection',
    id: 'gemma3:4b',
    label: 'Gemma 3 4B',
    params: '4B',
    size: '3.0 GB',
  },
  {
    contextWindow: 163_840,
    description: 'DeepSeek · 160K ctx, MoE (2.4B active params), 338 languages',
    id: 'deepseek-coder-v2:16b',
    label: 'DeepSeek Coder V2 16B',
    params: '16B (MoE)',
    size: '8.9 GB',
  },
  {
    contextWindow: 16_384,
    description: 'HuggingFace · strong multi-language test generation, 600+ languages',
    id: 'starcoder2:7b',
    label: 'StarCoder2 7B',
    params: '7B',
    size: '4.0 GB',
  },
  {
    contextWindow: 16_384,
    description: 'HuggingFace · 3T+ token training, matches original StarCoder-15B',
    id: 'starcoder2:3b',
    label: 'StarCoder2 3B',
    params: '3B',
    size: '1.7 GB',
  },
  {
    contextWindow: 4096,
    description: 'IBM · enterprise-grade, commercially licensed, Java/Python/Go focus',
    id: 'granite-code:8b',
    label: 'Granite Code 8B',
    params: '8B',
    size: '4.6 GB',
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · sub-1GB, fastest option, good for quick test scaffolding',
    id: 'qwen2.5-coder:1.5b',
    label: 'Qwen2.5 Coder 1.5B',
    params: '1.5B',
    size: '986 MB',
  },
  {
    contextWindow: 8192,
    description: 'Google · code-focused Gemma variant, strong Python/JS/Rust/Go',
    id: 'codegemma:7b',
    label: 'CodeGemma 7B',
    params: '7B',
    size: '5.0 GB',
  },
  {
    contextWindow: 16_384,
    description: 'Meta · classic code model, broad language support (legacy)',
    id: 'codellama:7b',
    label: 'CodeLlama 7B',
    params: '7B',
    size: '3.8 GB',
  },
]

export const DEFAULT_TEST_MODEL = 'qwen2.5-coder:7b'
