import type { ModelOption } from '../types'

// Base model definitions shared across multiple task files.
// Use spread syntax to add task-specific descriptions:
//   { ...BASE_GRANITE_CODE_8B, description: 'IBM · 125K ctx, ...' }
//
// Only models that appear in 2+ files live here. Single-use models
// (tavernari commit models, translate models, phi3, gemma3:1b) stay inline.

type ModelBase = Omit<ModelOption, 'description'>

// ── Qwen 2.5 (general) ───────────────────────────────────────────────────────

export const BASE_QWEN25_05B: ModelBase = {
  contextWindow: 32_768,
  id: 'qwen2.5:0.5b',
  label: 'Qwen 2.5',
  params: '0.5B',
  size: 0.398,
}

export const BASE_QWEN25_15B: ModelBase = {
  contextWindow: 32_768,
  id: 'qwen2.5:1.5b',
  label: 'Qwen 2.5',
  params: '1.5B',
  size: 0.986,
}

// ── Qwen 2.5 Coder ───────────────────────────────────────────────────────────

export const BASE_QWEN25_CODER_05B: ModelBase = {
  contextWindow: 32_768,
  id: 'qwen2.5-coder:0.5b',
  label: 'Qwen2.5 Coder',
  params: '0.5B',
  size: 0.398,
}

export const BASE_QWEN25_CODER_15B: ModelBase = {
  contextWindow: 32_768,
  id: 'qwen2.5-coder:1.5b',
  label: 'Qwen2.5 Coder',
  params: '1.5B',
  size: 0.986,
}

export const BASE_QWEN25_CODER_3B: ModelBase = {
  contextWindow: 32_768,
  id: 'qwen2.5-coder:3b',
  label: 'Qwen2.5 Coder',
  params: '3B',
  size: 1.9,
}

export const BASE_QWEN25_CODER_7B: ModelBase = {
  contextWindow: 32_768,
  id: 'qwen2.5-coder:7b',
  label: 'Qwen2.5 Coder',
  params: '7B',
  size: 4.7,
}

export const BASE_QWEN25_CODER_14B: ModelBase = {
  contextWindow: 32_768,
  id: 'qwen2.5-coder:14b',
  label: 'Qwen2.5 Coder',
  params: '14B',
  size: 9,
}

// ── Llama ────────────────────────────────────────────────────────────────────

export const BASE_LLAMA32_1B: ModelBase = {
  contextWindow: 131_072,
  id: 'llama3.2:1b',
  label: 'Llama 3.2',
  params: '1B',
  size: 1.3,
}

// ── Granite 3.3 ──────────────────────────────────────────────────────────────

export const BASE_GRANITE33_2B: ModelBase = {
  contextWindow: 131_072,
  id: 'granite3.3:2b',
  label: 'Granite 3.3',
  params: '2B',
  size: 1.5,
}

// ── Granite Code ─────────────────────────────────────────────────────────────

export const BASE_GRANITE_CODE_3B: ModelBase = {
  contextWindow: 128_000,
  id: 'granite-code:3b',
  label: 'Granite Code',
  params: '3B',
  size: 2,
}

export const BASE_GRANITE_CODE_8B: ModelBase = {
  contextWindow: 128_000,
  id: 'granite-code:8b',
  label: 'Granite Code',
  params: '8B',
  size: 4.6,
}

// ── Devstral ─────────────────────────────────────────────────────────────────

export const BASE_DEVSTRAL_24B: ModelBase = {
  contextWindow: 131_072,
  id: 'devstral:24b',
  label: 'Devstral',
  params: '24B',
  size: 14,
}

// ── DeepSeek Coder V2 ────────────────────────────────────────────────────────

export const BASE_DEEPSEEK_CODER_V2_16B: ModelBase = {
  contextWindow: 163_840,
  id: 'deepseek-coder-v2:16b',
  label: 'DeepSeek Coder V2',
  params: '16B',
  size: 8.9,
}

// ── Phi 4 Mini ───────────────────────────────────────────────────────────────

export const BASE_PHI4_MINI: ModelBase = {
  contextWindow: 131_072,
  id: 'phi4-mini:3.8b',
  label: 'Phi 4 Mini',
  params: '3.8B',
  size: 2.5,
}
