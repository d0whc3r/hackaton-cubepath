import type { CostEstimate } from '../schemas/route'
import { PROVIDERS, calcProviderCost, getRepresentativeModel } from './pricing'

/** Rough chars-to-tokens heuristic: ~4 chars per token */
function charsToTokens(chars: number): number {
  return Math.ceil(chars / 4)
}

/** Local SLM electricity/infra estimate: ~$1 per million tokens for input/output. */
const SPECIALIST_INPUT_COST_PER_TOKEN = 0.000_001
const SPECIALIST_OUTPUT_COST_PER_TOKEN = 0.000_001

export function estimateCost(inputChars: number, outputChars: number): CostEstimate {
  const inputTokens = charsToTokens(inputChars)
  const outputTokens = charsToTokens(outputChars)

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
  }).filter((prov): prov is NonNullable<typeof prov> => prov !== null)

  const specialistCostUsd =
    inputTokens * SPECIALIST_INPUT_COST_PER_TOKEN + outputTokens * SPECIALIST_OUTPUT_COST_PER_TOKEN
  const largeModelCostUsd = providerComparisons.reduce((maxCost, provider) => Math.max(maxCost, provider.costUsd), 0)
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
