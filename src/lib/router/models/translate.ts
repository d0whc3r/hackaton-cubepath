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
    contextWindow: 8192,
    description: 'icky · purpose-built translator, fast and accurate; best default for prose',
    id: 'icky/translate',
    label: 'icky/translate',
    params: '~1B',
    size: '1.6 GB',
  },
  {
    canTranslateCode: false,
    contextWindow: 8192,
    description: 'Google · purpose-built translator on Gemma 3, 55 languages; best quality/size ratio',
    id: 'translategemma:4b',
    label: 'TranslateGemma 4B',
    params: '4B',
    size: '3.3 GB',
  },
  {
    canTranslateCode: false,
    contextWindow: 131_072,
    description: 'Community · Gemma 3 fine-tuned for strict literal translation, ultra-lightweight',
    id: 'zongwei/gemma3-translator:1b',
    label: 'Gemma3 Translator 1B',
    params: '1B',
    size: '815 MB',
  },
  {
    canTranslateCode: false,
    contextWindow: 131_072,
    description: 'Community · Gemma 3 fine-tuned for translation, 128K ctx, good quality at 4B',
    id: 'zongwei/gemma3-translator:4b',
    label: 'Gemma3 Translator 4B',
    params: '4B',
    size: '3.3 GB',
  },
  {
    canTranslateCode: false,
    contextWindow: 8192,
    description: 'Google · higher quality TranslateGemma variant, 55 languages, 128K ctx',
    id: 'translategemma:12b',
    label: 'TranslateGemma 12B',
    params: '12B',
    size: '8.1 GB',
  },
  {
    canTranslateCode: true,
    contextWindow: 8192,
    description: 'Fine-tuned Gemma 2 · 28 languages, trained on 56B multilingual tokens, handles code',
    id: 'omercelik/gemmax2-9b',
    label: 'GemmaX2 9B',
    params: '9B',
    size: '5.2 GB',
  },
  {
    canTranslateCode: true,
    contextWindow: 8192,
    description: 'Llama 3 continued pre-training · 102+ languages, strong cross-lingual capability, handles code',
    id: 'mannix/llamax3-8b-alpaca',
    label: 'LLaMAX3 8B',
    params: '8B',
    size: '4.9 GB',
  },
  {
    canTranslateCode: true,
    contextWindow: 8192,
    description: 'Cohere · general multilingual model, 23 languages, strong instruction following, handles code',
    id: 'aya-expanse:8b',
    label: 'Aya Expanse 8B',
    params: '8B',
    size: '4.9 GB',
  },
  {
    canTranslateCode: true,
    contextWindow: 8192,
    description: 'Cohere · original Aya, strong multilingual baseline, 23 languages, handles code',
    id: 'aya:8b',
    label: 'Aya 8B',
    params: '8B',
    size: '4.8 GB',
  },
]

export const DEFAULT_TRANSLATE_MODEL = 'icky/translate'
