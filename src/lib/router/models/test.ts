import type { ModelOption } from '../types'

// ── Test generation ───────────────────────────────────────────────────────────
// Code-specialist models best at generating comprehensive test suites.
// All models are code-fine-tuned or purpose-built for software engineering tasks.
export const TEST_MODELS: ModelOption[] = [
  {
    contextWindow: 32_768,
    description: 'Alibaba · strongest default for unit-test generation on practical local hardware',
    id: 'qwen2.5-coder:7b',
    label: 'Qwen2.5 Coder',
    params: '7B',
    size: 4.7,
  },
  {
    contextWindow: 163_840,
    description:
      'DeepSeek · MoE 16B at ~2.4B active params, 160K ctx, top HumanEval scores for test generation on a laptop budget',
    id: 'deepseek-coder-v2:16b',
    label: 'DeepSeek Coder V2',
    params: '16B',
    size: 8.9,
  },
  {
    contextWindow: 131_072,
    description:
      'Mistral/All Hands · 128K ctx, agentic software-engineering model built for generating comprehensive test suites',
    id: 'devstral:24b',
    label: 'Devstral',
    params: '24B',
    size: 14,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · best high-quality option under 10 GB for harder test suites with edge cases',
    id: 'qwen2.5-coder:14b',
    label: 'Qwen2.5 Coder',
    params: '14B',
    size: 9,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · 125K ctx, code-specialized option for larger files and broader test context',
    id: 'granite-code:8b',
    label: 'Granite Code',
    params: '8B',
    size: 4.6,
  },
  {
    contextWindow: 128_000,
    description: 'IBM · lighter long-context fallback for generating tests across larger files on low-RAM machines',
    id: 'granite-code:3b',
    label: 'Granite Code',
    params: '3B',
    size: 2,
  },
  {
    contextWindow: 32_768,
    description: 'Alibaba · best budget option when you still want code-tuned test generation',
    id: 'qwen2.5-coder:3b',
    label: 'Qwen2.5 Coder',
    params: '3B',
    size: 1.9,
  },
]

export const DEFAULT_TEST_MODEL = TEST_MODELS[0].id
