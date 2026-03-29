import type { ModelOption } from '../types'
import {
  BASE_DEEPSEEK_CODER_V2_16B,
  BASE_DEVSTRAL_24B,
  BASE_GRANITE_CODE_3B,
  BASE_GRANITE_CODE_8B,
  BASE_QWEN25_CODER_14B,
  BASE_QWEN25_CODER_3B,
  BASE_QWEN25_CODER_7B,
} from './shared'

// ── Test generation ───────────────────────────────────────────────────────────
// Code-specialist models best at generating comprehensive test suites.
// All models are code-fine-tuned or purpose-built for software engineering tasks.
export const TEST_MODELS: ModelOption[] = [
  {
    ...BASE_QWEN25_CODER_7B,
    description: 'Alibaba · strongest default for unit-test generation on practical local hardware',
  },
  {
    ...BASE_DEEPSEEK_CODER_V2_16B,
    description:
      'DeepSeek · MoE 16B at ~2.4B active params, 160K ctx, top HumanEval scores for test generation on a laptop budget',
  },
  {
    ...BASE_DEVSTRAL_24B,
    description:
      'Mistral/All Hands · 128K ctx, agentic software-engineering model built for generating comprehensive test suites',
  },
  {
    ...BASE_QWEN25_CODER_14B,
    description: 'Alibaba · best high-quality option under 10 GB for harder test suites with edge cases',
  },
  {
    ...BASE_GRANITE_CODE_8B,
    description: 'IBM · 125K ctx, code-specialized option for larger files and broader test context',
  },
  {
    ...BASE_GRANITE_CODE_3B,
    description: 'IBM · lighter long-context fallback for generating tests across larger files on low-RAM machines',
  },
  {
    ...BASE_QWEN25_CODER_3B,
    description: 'Alibaba · best budget option when you still want code-tuned test generation',
  },
]

export const DEFAULT_TEST_MODEL = TEST_MODELS[0].id
