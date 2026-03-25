import type { ModelConfig } from '@/lib/config/model-config'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PullState, SectionDef } from './types'
import { CONTEXT_DIVISOR, CUSTOM_VALUE } from './constants'
import { formatModelSizeGb } from './helpers'
import { ModelStatusBadge } from './ModelStatusBadge'

interface ModelSectionCardProps {
  section: SectionDef
  config: ModelConfig
  isActive: boolean
  selectValue: string
  isCustom: boolean
  customValue: string
  defaultModelId: string
  isInstalled: boolean
  installedModelsReady: boolean
  pullState?: PullState
  ollamaBaseUrl: string
  onActivate: () => void
  onModelChange: (value: string) => void
  onCustomModelChange: (value: string) => void
  onPull: (modelId: string, baseUrl: string) => void
}

export function ModelSectionCard({
  section,
  config,
  isActive,
  selectValue,
  isCustom,
  customValue,
  defaultModelId,
  isInstalled,
  installedModelsReady,
  pullState,
  ollamaBaseUrl,
  onActivate,
  onModelChange,
  onCustomModelChange,
  onPull,
}: ModelSectionCardProps) {
  const currentModelId = config[section.configKey] as string
  const selectedModel = section.models.find((model) => model.id === currentModelId)
  const contextLabel = selectedModel?.contextWindow
    ? `${Math.round(selectedModel.contextWindow / CONTEXT_DIVISOR)}K ctx`
    : 'Context n/a'

  return (
    <button
      type="button"
      onClick={onActivate}
      className={[
        'w-full space-y-3 rounded-xl border bg-transparent p-3 text-left transition-all',
        section.accent,
        isActive ? 'border-primary/60 ring-2 ring-primary/20 ring-offset-1' : 'hover:border-primary/30',
      ].join(' ')}
      aria-pressed={isActive}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{section.title}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{section.subtitle}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{section.selectionHint}</p>
        </div>

        <div className="shrink-0 pt-0.5">
          {installedModelsReady ? (
            <ModelStatusBadge
              modelId={currentModelId}
              installed={isInstalled}
              pullState={pullState}
              ollamaBaseUrl={ollamaBaseUrl}
              onPull={onPull}
            />
          ) : (
            <Badge variant="outline" className="h-5 rounded-full px-1.5 text-[10px] text-muted-foreground">
              Checking...
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {selectedModel && (
          <>
            <Badge variant="outline" className="text-[10px]">
              {selectedModel.params}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {formatModelSizeGb(selectedModel)}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {contextLabel}
            </Badge>
          </>
        )}
      </div>

      <Select value={selectValue} onValueChange={onModelChange}>
        <SelectTrigger className="h-9 text-xs" onClick={(event) => event.stopPropagation()}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {section.models.map((model) => (
            <SelectItem key={model.id} value={model.id} className="text-xs">
              <span className="font-medium">{model.label}</span>
              <span className="ml-1.5 text-muted-foreground">
                {model.params} · {formatModelSizeGb(model)}
              </span>
              {model.id === defaultModelId && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                  recommended
                </span>
              )}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_VALUE} className="text-xs text-muted-foreground">
            Custom model ID...
          </SelectItem>
        </SelectContent>
      </Select>

      {isCustom && (
        <Input
          value={customValue}
          onChange={(event) => onCustomModelChange(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          placeholder="e.g. my-custom-model:latest"
          className="h-8 font-mono text-xs"
        />
      )}
    </button>
  )
}
