/**
 * LLM Provider Pricing Constants
 *
 * Prices are in USD per 1 million tokens (input / output).
 * Last updated: 2026-03
 *
 * To update these prices, follow the instructions in:
 *   docs/prompts/update-prices.md
 */

export interface ProviderModel {
  id: string
  label: string
  /** USD per 1 million input tokens */
  inputPricePerMillion: number
  /** USD per 1 million output tokens */
  outputPricePerMillion: number
}

export interface Provider {
  id: string
  label: string
  models: ProviderModel[]
  /** The model shown in cost comparisons (a popular/representative option) */
  representativeModelId: string
}

// ── OpenAI ────────────────────────────────────────────────────────────────────

const OPENAI_MODELS: ProviderModel[] = [
  {
    id: 'gpt-4o',
    inputPricePerMillion: 2.5,
    label: 'GPT-4o',
    outputPricePerMillion: 10,
  },
  {
    id: 'gpt-4o-mini',
    inputPricePerMillion: 0.15,
    label: 'GPT-4o mini',
    outputPricePerMillion: 0.6,
  },
  {
    id: 'gpt-4-turbo',
    inputPricePerMillion: 10,
    label: 'GPT-4 Turbo',
    outputPricePerMillion: 30,
  },
]

// ── Google Gemini ─────────────────────────────────────────────────────────────

const GEMINI_MODELS: ProviderModel[] = [
  {
    id: 'gemini-2.0-flash',
    inputPricePerMillion: 0.1,
    label: 'Gemini 2.0 Flash',
    outputPricePerMillion: 0.4,
  },
  {
    id: 'gemini-1.5-pro',
    inputPricePerMillion: 1.25,
    label: 'Gemini 1.5 Pro',
    outputPricePerMillion: 5,
  },
  {
    id: 'gemini-1.5-flash',
    inputPricePerMillion: 0.075,
    label: 'Gemini 1.5 Flash',
    outputPricePerMillion: 0.3,
  },
]

// ── Anthropic Claude ──────────────────────────────────────────────────────────

const CLAUDE_MODELS: ProviderModel[] = [
  {
    id: 'claude-sonnet-4-6',
    inputPricePerMillion: 3,
    label: 'Claude Sonnet 4.6',
    outputPricePerMillion: 15,
  },
  {
    id: 'claude-3-5-haiku',
    inputPricePerMillion: 0.8,
    label: 'Claude 3.5 Haiku',
    outputPricePerMillion: 4,
  },
  {
    id: 'claude-opus-4-6',
    inputPricePerMillion: 5,
    label: 'Claude Opus 4.6',
    outputPricePerMillion: 25,
  },
]

// ── Exports ───────────────────────────────────────────────────────────────────

export const PROVIDERS: Provider[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    models: OPENAI_MODELS,
    representativeModelId: 'gpt-4o',
  },
  {
    id: 'google',
    label: 'Google',
    models: GEMINI_MODELS,
    representativeModelId: 'gemini-2.0-flash',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    models: CLAUDE_MODELS,
    representativeModelId: 'claude-sonnet-4-6',
  },
]

/**
 * Specialist (local SLM via Ollama) cost — effectively free, but we assign
 * a tiny electricity/infra estimate so comparisons still make sense.
 * ~$0.00 — used only to show "you ran this locally".
 */
export const SPECIALIST_LOCAL_COST_PER_TOKEN = 0
export const MILLION_UNIT = 1_000_000

export function getRepresentativeModel(provider: Provider): ProviderModel | undefined {
  return provider.models.find((model) => model.id === provider.representativeModelId)
}

export function calcProviderCost(model: ProviderModel, inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens * model.inputPricePerMillion) / MILLION_UNIT +
    (outputTokens * model.outputPricePerMillion) / MILLION_UNIT
  )
}
