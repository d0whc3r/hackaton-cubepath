import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import type { OllamaHealth, OllamaHealthStatus } from '@/hooks/use-ollama-health'
import type { ModelConfig } from '@/lib/config/model-config'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOllamaHealth } from '@/hooks/use-ollama-health'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'
import { SECTIONS } from './constants'
import { buildModelSizeIndex, formatGb, getUniqueSelectedModelIds, getUniqueSelectedSizeGb } from './helpers'

type CheckStatus = 'ok' | 'warn' | 'error' | 'loading' | 'stale'

function connectionStatus(healthStatus: OllamaHealthStatus): CheckStatus {
  if (healthStatus === 'loading') {
    return 'loading'
  }
  if (healthStatus === 'unreachable') {
    return 'error'
  }
  if (healthStatus === 'stale') {
    return 'stale'
  }
  return 'ok'
}

function modelStatus(healthStatus: OllamaHealthStatus, isInstalled: boolean): CheckStatus {
  if (healthStatus === 'loading') {
    return 'loading'
  }
  if (healthStatus === 'stale') {
    return 'stale'
  }
  return isInstalled ? 'ok' : 'warn'
}

const STATUS_CONFIG: Record<OllamaHealthStatus, { dot: string; label: string; labelClass: string }> = {
  degraded: {
    dot: 'bg-yellow-500',
    label: 'Degraded',
    labelClass: 'text-yellow-600 dark:text-yellow-400',
  },
  healthy: {
    dot: 'bg-emerald-500',
    label: 'Connected',
    labelClass: 'text-emerald-600 dark:text-emerald-400',
  },
  loading: {
    dot: 'bg-muted-foreground animate-pulse',
    label: 'Checking…',
    labelClass: 'text-muted-foreground',
  },
  stale: {
    dot: 'bg-border',
    label: 'Not verified',
    labelClass: 'text-muted-foreground',
  },
  unreachable: {
    dot: 'bg-destructive',
    label: 'Unreachable',
    labelClass: 'text-destructive',
  },
}

const GROUP_LABELS: Record<string, string> = {
  analysis: 'Analysis',
  generation: 'Generation',
  infrastructure: 'Core Routing',
  language: 'Language',
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'ok') {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
  }
  if (status === 'warn') {
    return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
  }
  if (status === 'error') {
    return <XCircle className="h-3.5 w-3.5 text-destructive" />
  }
  if (status === 'stale') {
    return <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />
  }
  return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
}

function ModelPill({ label, modelId, status }: { label: string; modelId: string; status: CheckStatus }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-2">
      <StatusIcon status={status} />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground">{label}</p>
        <p className="truncate font-mono text-[10px] text-muted-foreground">{modelId}</p>
      </div>
    </div>
  )
}

function ModelHealthGrid({ health, config }: { health: OllamaHealth; config: ModelConfig }) {
  const sizeByModel = buildModelSizeIndex(SECTIONS)

  return (
    <div className="space-y-3">
      {(['infrastructure', 'analysis', 'generation', 'language'] as const).map((group) => {
        const groupSections = SECTIONS.filter((section) => section.group === group)
        const uniqueModelIds = [
          ...new Set(groupSections.map((section) => config[section.configKey] as string).filter(Boolean)),
        ]
        const totalSizeGb = uniqueModelIds.reduce((total, modelId) => total + (sizeByModel.get(modelId) ?? 0), 0)

        return (
          <div key={group}>
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              {GROUP_LABELS[group]}
            </p>
            <p className="mb-1.5 text-[10px] text-muted-foreground">
              {uniqueModelIds.length} unique models · {formatGb(totalSizeGb)}
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {groupSections.map((section) => {
                const modelId = config[section.configKey as keyof ModelConfig] as string
                const isInstalled = health.installedModels.includes(modelId)
                return (
                  <ModelPill
                    key={section.id}
                    label={section.title}
                    modelId={modelId}
                    status={modelStatus(health.status, isInstalled)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface PlatformStatusPanelProps {
  config: ModelConfig
  onEndpointChange: (url: string) => void
}

export function PlatformStatusPanel({ config, onEndpointChange }: PlatformStatusPanelProps) {
  const [triggerKey, setTriggerKey] = useState(0)
  const health = useOllamaHealth(config, triggerKey)
  const [detailOpen, setDetailOpen] = useState(false)
  const selectedUniqueModels = getUniqueSelectedModelIds(config, SECTIONS)
  const selectedUniqueSizeGb = getUniqueSelectedSizeGb(config, SECTIONS)

  const cfg = STATUS_CONFIG[health.status]
  const connStatus = connectionStatus(health.status)
  const isLoaded = health.status !== 'loading'
  const hasDetail = health.status !== 'unreachable' && health.status !== 'stale'
  function buildModelSummary(): string {
    if (health.status === 'loading') {
      return 'Checking…'
    }
    if (health.status === 'stale') {
      return 'Click ↺ to verify the new endpoint'
    }
    if (health.status === 'unreachable') {
      return 'Cannot reach Ollama'
    }
    const taskPart = `${health.readyTasks}/${health.totalTasks} tasks`
    const modelPart = `${health.installedUniqueModels}/${health.totalUniqueModels} models`
    const sizePart = `${formatGb(selectedUniqueSizeGb)} selected`
    return `${taskPart} · ${modelPart} ready · ${sizePart}`
  }

  function handleRefresh() {
    setTriggerKey((previous) => previous + 1)
  }

  return (
    <section id="status" className="scroll-mt-24 rounded-xl border border-border bg-card shadow-sm">
      {/* Card header: endpoint input + live connection status */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="ollama-url" className="text-xs font-medium text-muted-foreground">
            Ollama Endpoint
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="ollama-url"
              value={config.ollamaBaseUrl}
              onChange={(event) => {
                onEndpointChange(event.target.value)
              }}
              placeholder={OLLAMA_BASE_URL_DEFAULT}
              className="max-w-sm font-mono text-xs"
            />
            {isLoaded && health.status !== 'stale' && health.ollamaVersion && (
              <span className="shrink-0 rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                v{health.ollamaVersion}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Local Ollama (<code className="font-mono">http://localhost:11434</code>) or a shared server endpoint.
          </p>
        </div>

        {/* Connection status + refresh */}
        <div className="flex shrink-0 items-center gap-2 sm:mt-5">
          <div className="flex items-center gap-1.5">
            <StatusIcon status={connStatus} />
            <span className={`text-xs font-medium ${cfg.labelClass}`}>{cfg.label}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={health.status === 'loading'}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            title="Verify connection"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${health.status === 'loading' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Model health summary — always visible once first check completes */}
      {isLoaded && (
        <div className="border-t border-border/60">
          <button
            type="button"
            onClick={() => {
              setDetailOpen((previous) => !previous)
            }}
            disabled={!hasDetail}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/30 disabled:cursor-default disabled:hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              <span className={`text-xs font-medium ${cfg.labelClass}`}>{buildModelSummary()}</span>
            </div>
            {hasDetail &&
              (detailOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ))}
          </button>

          {detailOpen && hasDetail && (
            <div className="border-t border-border/60 px-4 py-4">
              <ModelHealthGrid health={health} config={config} />
              {health.checkedAt && (
                <p className="mt-3 text-[10px] text-muted-foreground">
                  Checked at{' '}
                  {new Date(health.checkedAt).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
