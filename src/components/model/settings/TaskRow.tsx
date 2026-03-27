import { CheckCheck, ClipboardCopy, ExternalLink } from 'lucide-react'
import type { ModelRuntime } from '@/lib/router/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { PullState, SectionDef, SectionGroupId } from './types'
import { CUSTOM_VALUE } from './constants'
import { formatModelSizeGb, ollamaModelUrl } from './helpers'
import { ModelStatusBadge } from './ModelStatusBadge'

const CONTEXT_DIVISOR = 1000

const GROUP_BADGE: Record<SectionGroupId, { label: string; className: string }> = {
  analysis: {
    className: 'border-blue-500/20 bg-blue-500/10 text-blue-500',
    label: 'Analysis',
  },
  generation: {
    className: 'border-violet-500/20 bg-violet-500/10 text-violet-500',
    label: 'Generation',
  },
  infrastructure: {
    className: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    label: 'Core',
  },
  language: {
    className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    label: 'Language',
  },
}

interface TaskRowProps {
  section: SectionDef
  modelId: string
  isActive: boolean
  selectValue: string
  defaultModelId: string
  customValue: string
  isCustom: boolean
  isInstalled: boolean
  installedModelsReady: boolean
  modelRuntime: ModelRuntime
  pullState?: PullState
  ollamaBaseUrl: string
  copiedModelId: string | null
  showGroupBadge?: boolean
  onActivate: () => void
  onModelChange: (value: string) => void
  onCustomModelChange: (value: string) => void
  onPull: (modelId: string, baseUrl: string) => void
  onCopyPull: (modelId: string) => void
}

export function TaskRow({
  section,
  modelId,
  isActive,
  selectValue,
  defaultModelId,
  customValue,
  isCustom,
  isInstalled,
  installedModelsReady,
  modelRuntime,
  pullState,
  ollamaBaseUrl,
  copiedModelId,
  showGroupBadge = true,
  onActivate,
  onModelChange,
  onCustomModelChange,
  onPull,
  onCopyPull,
}: TaskRowProps) {
  const Icon = section.icon
  const badge = GROUP_BADGE[section.group]
  const isLocalRuntime = modelRuntime === 'local' || modelRuntime === 'small'
  const selectedModel = isCustom ? null : section.models.find((model) => model.id === modelId)
  const contextLabel = selectedModel?.contextWindow
    ? `${Math.round(selectedModel.contextWindow / CONTEXT_DIVISOR)}K ctx`
    : null
  const copied = copiedModelId === modelId
  const isCloudModel = selectedModel ? selectedModel.size <= 0 : false
  const canPull =
    isLocalRuntime && installedModelsReady && !isInstalled && !isCloudModel && pullState?.status !== 'done'
  let pullLabel = 'Pull model'
  if (pullState?.status === 'pulling') {
    pullLabel = `Pulling ${pullState.progress ?? ''}`.trim()
  } else if (pullState?.status === 'error') {
    pullLabel = 'Retry pull'
  }

  function handleRowKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate()
    }
  }

  return (
    <div
      className={cn(
        'flex cursor-pointer flex-col gap-4 px-5 py-4 transition-colors sm:flex-row sm:items-start sm:gap-6',
        isActive ? 'bg-accent/15' : 'hover:bg-accent/10',
      )}
      onClick={onActivate}
      onKeyDown={handleRowKeyDown}
      // oxlint-disable-next-line jsx_a11y/prefer-tag-over-role
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
    >
      {/* Left: task info */}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-muted/60 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-semibold text-foreground">{section.title}</span>
          {showGroupBadge && (
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wider uppercase',
                badge.className,
              )}
            >
              {badge.label}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{section.subtitle}</p>
        <p className="mt-1.5 text-[11px] text-muted-foreground/70 italic">{section.selectionHint}</p>
        {isLocalRuntime && installedModelsReady && (
          <div className="mt-2 flex items-center">
            {/* oxlint-disable-next-line jsx_a11y/click-events-have-key-events, sx_a11y/no-static-element-interactions */}
            <div onClick={(event) => event.stopPropagation()}>
              <ModelStatusBadge
                modelId={modelId}
                installed={isInstalled}
                pullState={pullState}
                ollamaBaseUrl={ollamaBaseUrl}
                onPull={onPull}
              />
            </div>
          </div>
        )}
      </div>

      {/* oxlint-disable-next-line jsx_a11y/click-events-have-key-events, jsx_a11y/no-static-element-interactions
      Right: select + model details */}
      <div className="flex w-full shrink-0 flex-col gap-3 sm:w-104" onClick={(event) => event.stopPropagation()}>
        {/* Select */}
        <div className="flex min-w-0 items-center gap-2">
          <Select value={selectValue} onValueChange={onModelChange}>
            <SelectTrigger className="h-9 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {section.models.map((model) => (
                <SelectItem key={model.id} value={model.id} className="text-xs">
                  <span className="font-medium">{model.label}</span>
                  {model.id === defaultModelId && (
                    <span className="ml-2 rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                      Recommended
                    </span>
                  )}
                  <span className="ml-1.5 text-muted-foreground">
                    {model.params} · {formatModelSizeGb(model)}
                  </span>
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_VALUE} className="text-xs text-muted-foreground">
                Custom model ID...
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom model input */}
        {isCustom && (
          <Input
            value={customValue}
            onChange={(event) => onCustomModelChange(event.target.value)}
            placeholder="e.g. my-custom-model:latest"
            className="h-8 font-mono text-xs"
            aria-label={`Custom model ID for ${section.title}`}
          />
        )}

        {/* Model details: chips + description + actions */}
        {isCustom
          ? modelId && (
              <div className="space-y-2 border-t border-border/40 pt-2">
                <p className="font-mono text-xs text-muted-foreground">{modelId}</p>
                <a
                  href={`https://ollama.com/search?q=${encodeURIComponent(modelId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Search on Ollama
                </a>
              </div>
            )
          : selectedModel && (
              <div className="space-y-2.5 border-t border-border/40 pt-2">
                {/* Stat chips */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {selectedModel.params}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {formatModelSizeGb(selectedModel)}
                  </Badge>
                  {contextLabel && (
                    <Badge variant="outline" className="text-[10px]">
                      {contextLabel}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {selectedModel.description && (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{selectedModel.description}</p>
                )}

                <Separator className="opacity-50" />

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <a
                    href={ollamaModelUrl(selectedModel.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on Ollama
                  </a>

                  {isLocalRuntime && !isCloudModel && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto gap-1 px-0 py-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => onCopyPull(selectedModel.id)}
                    >
                      {copied ? (
                        <>
                          <CheckCheck className="h-3 w-3 text-green-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="h-3 w-3" />
                          Copy pull command
                        </>
                      )}
                    </Button>
                  )}

                  {canPull && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onPull(modelId, ollamaBaseUrl)}
                      disabled={pullState?.status === 'pulling'}
                    >
                      {pullLabel}
                    </Button>
                  )}
                </div>
              </div>
            )}
      </div>
    </div>
  )
}
