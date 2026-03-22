import type { CostEstimate } from '../schemas/route'

import { PROVIDERS, calcProviderCost, getRepresentativeModel } from './pricing'

/** Rough chars-to-tokens heuristic: ~4 chars per token */
function charsToTokens(chars: number): number {
  return Math.ceil(chars / 4)
}

/** Local SLM electricity/infra estimate: ~$1 per million tokens */
const SPECIALIST_COST_PER_TOKEN = 0.000_001

/** Representative large cloud model rate: ~$15 per million tokens */
const LARGE_MODEL_COST_PER_TOKEN = 0.000_015

export function estimateCost(inputChars: number, outputChars: number): CostEstimate {
  const inputTokens = charsToTokens(inputChars)
  const outputTokens = charsToTokens(outputChars)
  const totalTokens = inputTokens + outputTokens

  const providerComparisons = PROVIDERS.map((provider) => {
    const model = getRepresentativeModel(provider)
    if (!model) {
      return null
    }
    return {
      costUsd: calcProviderCost(model, inputTokens, outputTokens),
      modelId: model.id,
      modelLabel: model.label,
      providerId: provider.id,
      providerLabel: provider.label,
    }
  }).filter((c): c is NonNullable<typeof c> => c !== null)

  const specialistCostUsd = totalTokens * SPECIALIST_COST_PER_TOKEN
  const largeModelCostUsd = totalTokens * LARGE_MODEL_COST_PER_TOKEN
  const savingsPct = largeModelCostUsd === 0 ? 0 : Math.round((1 - specialistCostUsd / largeModelCostUsd) * 100)

  return {
    inputTokens,
    largeModelCostUsd,
    outputTokens,
    providerComparisons,
    savingsPct,
    specialistCostUsd,
  }
}
