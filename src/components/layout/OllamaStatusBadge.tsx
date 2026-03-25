import { AlertTriangle, CheckCircle2, CircleDashed, Loader2, XCircle } from 'lucide-react'
import { useMemo } from 'react'
import type { OllamaHealth, OllamaHealthStatus } from '@/hooks/use-ollama-health'
import { useOllamaHealth } from '@/hooks/use-ollama-health'
import { loadModelConfig } from '@/lib/config/model-config'

interface StatusEntry {
  label: (health: OllamaHealth) => string
  icon: React.ComponentType<{ className?: string }>
  classes: string
}

const STATUS_CONFIG: Record<OllamaHealthStatus, StatusEntry> = {
  degraded: {
    classes: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    icon: AlertTriangle,
    label: (info) =>
      `${info.readyTasks}/${info.totalTasks} tasks · ${info.installedUniqueModels}/${info.totalUniqueModels} models`,
  },
  healthy: {
    classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
    label: (info) =>
      `${info.readyTasks}/${info.totalTasks} tasks · ${info.installedUniqueModels}/${info.totalUniqueModels} models`,
  },
  loading: {
    classes: 'border-border/50 bg-muted/50 text-muted-foreground',
    icon: Loader2,
    label: () => 'Checking Ollama…',
  },
  stale: {
    classes: 'border-border/50 bg-muted/50 text-muted-foreground',
    icon: CircleDashed,
    label: () => 'Not verified',
  },
  unreachable: {
    classes: 'border-destructive/30 bg-destructive/10 text-destructive',
    icon: XCircle,
    label: () => 'Ollama unreachable',
  },
}

// Fixed trigger: badge checks once on mount. URL edits happen only in settings, not here.
const TRIGGER_KEY = 0

function OllamaStatusBadgeInner() {
  const config = useMemo(() => loadModelConfig(), [])
  const health = useOllamaHealth(config, TRIGGER_KEY)

  const cfg = STATUS_CONFIG[health.status]
  const Icon = cfg.icon
  const label = cfg.label(health)
  const isActionable = health.status === 'degraded' || health.status === 'unreachable'

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${cfg.classes} ${isActionable ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      <Icon className={`h-3.5 w-3.5 ${health.status === 'loading' ? 'animate-spin' : ''}`} />
      {label}
      {isActionable && <span className="ml-0.5 opacity-70">→ Configure</span>}
    </span>
  )

  if (isActionable) {
    return (
      <a href="/settings#status" className="inline-flex">
        {badge}
      </a>
    )
  }

  return badge
}

export function OllamaStatusBadge() {
  return <OllamaStatusBadgeInner />
}
