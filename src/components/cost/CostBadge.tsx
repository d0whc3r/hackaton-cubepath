import { Info, TrendingDown } from 'lucide-react'

import type { CostEstimate } from '@/lib/schemas/route'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatUsd } from '@/lib/utils/format'

const THOUSAND = 1000

function formatTokens(tokens: number): string {
  return tokens >= THOUSAND ? `${(tokens / THOUSAND).toFixed(1)}k` : String(tokens)
}

interface CostBadgeProps {
  readonly cost: CostEstimate
}

export function CostBadge({ cost }: CostBadgeProps) {
  const comparisons = cost.providerComparisons ?? []
  // Use the most expensive provider as the headline comparison
  const top = comparisons.reduce<(typeof comparisons)[number] | null>(
    (max, provider) => (!max || provider.costUsd > max.costUsd ? provider : max),
    null,
  )

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
      <TrendingDown className="h-3.5 w-3.5 shrink-0 text-green-500" />

      {/* Token counts */}
      <span className="text-[10px] text-muted-foreground">
        {formatTokens(cost.inputTokens)}↑ {formatTokens(cost.outputTokens)}↓
      </span>

      <span className="text-[10px] text-muted-foreground">·</span>

      {/* Free local run */}
      <span className="font-mono text-[11px] font-semibold text-green-600 dark:text-green-400">Free</span>
      <span className="text-[10px] text-muted-foreground">via Ollama</span>

      {/* Savings vs top provider */}
      {top && (
        <>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">
            saved{' '}
            <span className="font-mono font-semibold text-green-600 dark:text-green-400">{formatUsd(top.costUsd)}</span>{' '}
            vs {top.providerLabel}
          </span>
        </>
      )}

      {/* Full breakdown tooltip */}
      {comparisons.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="ml-auto h-3 w-3 shrink-0 cursor-default text-muted-foreground/60" />
          </TooltipTrigger>
          <TooltipContent side="top" className="w-56 text-xs">
            <p className="mb-2 font-semibold">Cloud equivalent cost</p>
            <div className="space-y-1">
              {comparisons.map((provider) => (
                <div key={provider.providerId} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {provider.providerLabel} · {provider.modelLabel}
                  </span>
                  <span className="font-mono">{formatUsd(provider.costUsd)}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-muted-foreground/70">
              Tokens estimated at ~4 chars/token. Official published pricing.
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
