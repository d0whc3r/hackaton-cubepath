import { TrendingDown } from 'lucide-react'
import type { CostEstimate } from '@/lib/schemas/route'
import { formatUsd } from '@/lib/utils/format'

const THOUSAND = 1000

function formatTokens(tokens: number): string {
  return tokens >= THOUSAND ? `${(tokens / THOUSAND).toFixed(1)}k` : String(tokens)
}

interface CostBadgeProps {
  cost: CostEstimate
}

export function CostBadge({ cost }: CostBadgeProps) {
  const comparisons = [...(cost.providerComparisons ?? [])].toSorted(
    (aProvider, bProvider) => bProvider.costUsd - aProvider.costUsd,
  )
  // Use the most expensive provider as the headline comparison
  const top = comparisons.reduce<(typeof comparisons)[number] | null>(
    (max, provider) => (!max || provider.costUsd > max.costUsd ? provider : max),
    null,
  )

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <TrendingDown className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
          {top ? (
            <>
              Saved{' '}
              <span className="font-mono font-semibold text-green-700 dark:text-green-300">
                {formatUsd(top.costUsd)}
              </span>{' '}
              vs cloud
            </>
          ) : (
            <>Cost estimate</>
          )}
        </p>
        <span className="text-[10px] text-muted-foreground">
          {formatTokens(cost.inputTokens)} in · {formatTokens(cost.outputTokens)} out
        </span>
      </div>

      {comparisons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {comparisons.map((provider) => (
            <span
              key={provider.providerId}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              <span className="text-foreground/80">{provider.providerLabel}</span> {formatUsd(provider.costUsd)}
            </span>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/70">Est. with public token pricing.</p>
    </div>
  )
}
