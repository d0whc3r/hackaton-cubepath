import type { CostEstimate } from '../lib/router/types'

interface CostBadgeProps {
  cost: CostEstimate | null
}

function formatUsd(usd: number): string {
  return `$${usd.toFixed(6)}`
}

export function CostBadge({ cost }: Readonly<CostBadgeProps>) {
  if (!cost) {
    return null
  }

  return (
    <div className="rounded border px-3 py-2 text-xs">
      <span className="text-muted-foreground">estimated · </span>
      <span>Specialist: {formatUsd(cost.specialistCostUsd)}</span>
      <span> · </span>
      <span>Large model: {formatUsd(cost.largeModelCostUsd)}</span>
      <span> · </span>
      <span>{cost.savingsPct}% cheaper</span>
    </div>
  )
}
