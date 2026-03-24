import type { ModelOption } from '../types'

// ── Translation ────────────────────────────────────────────────────────────────
// Models specifically fine-tuned for translation tasks. Prefer dedicated
// Translation models over general-purpose LLMs for better accuracy.
//
// CanTranslateCode: true → model can handle code blocks inline (general-purpose
//   Instruction-following base). When false/absent, code blocks are extracted
//   Client-side before sending, so only prose reaches the model.
export const TRANSLATE_MODELS: ModelOption[] = [
  {
    canTranslateCode: false,
    contextWindow: 131_072,
    description: 'Google · dedicated translation model for 55 languages, best default for prose translation',
    id: 'translategemma:4b',
    label: 'TranslateGemma 4B',
    params: '4B',
    size: '3.3 GB',
  },
  {
    canTranslateCode: false,
    contextWindow: 131_072,
    description: 'Google · higher-quality dedicated translator when latency and RAM are less important',
    id: 'translategemma:12b',
    label: 'TranslateGemma 12B',
    params: '12B',
    size: '8.1 GB',
  },
  {
    canTranslateCode: false,
    contextWindow: 8192,
    description: 'icky · tiny dedicated translator, still useful as the lightest prose-only option',
    id: 'icky/translate',
    label: 'icky/translate',
    params: '~1B',
    size: '1.6 GB',
  },
  {
    canTranslateCode: false,
    contextWindow: 131_072,
    description: 'Community · dedicated literal translator on Gemma 3 with strong long-context behaviour',
    id: 'zongwei/gemma3-translator:4b',
    label: 'Gemma3 Translator 4B',
    params: '4B',
    size: '3.3 GB',
  },
  {
    canTranslateCode: false,
    contextWindow: 32_768,
    description: 'Community · smallest dedicated translator in the list for very constrained local setups',
    id: 'zongwei/gemma3-translator:1b',
    label: 'Gemma3 Translator 1B',
    params: '1B',
    size: '815 MB',
  },
]

export const DEFAULT_TRANSLATE_MODEL = 'translategemma:4b'
