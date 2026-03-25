import { CheckCheck, ClipboardCopy, ExternalLink } from 'lucide-react'
import type { ModelConfig } from '@/lib/config/model-config'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { PullState, RuntimeModelDetails, SectionDef } from './types'
import { formatGb, formatModelSizeGb, ollamaModelUrl } from './helpers'

interface ModelDetailsPanelProps {
  section: SectionDef
  config: ModelConfig
  isCustom: boolean
  isInstalled: boolean
  copiedModelId: string | null
  pullState?: PullState
  runtimeDetails: RuntimeModelDetails | null
  ollamaBaseUrl: string
  onPull: (modelId: string, baseUrl: string) => void
  onCopyPull: (modelId: string) => void
}

const BYTES_IN_GB = 1024 * 1024 * 1024
const CONTEXT_DIVISOR = 1000

export function ModelDetailsPanel({
  section,
  config,
  isCustom,
  isInstalled,
  copiedModelId,
  pullState,
  runtimeDetails,
  ollamaBaseUrl,
  onPull,
  onCopyPull,
}: ModelDetailsPanelProps) {
  const activeModelId = config[section.configKey] as string
  const activeModel = section.models.find((model) => model.id === activeModelId)
  const copied = copiedModelId === activeModelId
  const canPullFromDetail = !isInstalled && pullState?.status !== 'done'
  let pullLabel = 'Pull model'
  if (pullState?.status === 'pulling') {
    pullLabel = `Pulling ${pullState.progress ?? ''}`.trim()
  } else if (pullState?.status === 'error') {
    pullLabel = 'Retry pull'
  }
  const modelContext = runtimeDetails?.contextLength ?? activeModel?.contextWindow
  const modelParams = runtimeDetails?.parameterSize ?? activeModel?.params
  const modelFamily = runtimeDetails?.family
  const quantization = runtimeDetails?.quantizationLevel
  const modifiedAt = runtimeDetails?.modifiedAt
  let modelSize: string | null = null
  if (runtimeDetails?.sizeBytes) {
    modelSize = `${(runtimeDetails.sizeBytes / BYTES_IN_GB).toFixed(1)} GB`
  } else if (activeModel) {
    modelSize = formatGb(activeModel.size)
  }

  return (
    <div className="sticky top-20 rounded-xl border border-border/70 bg-transparent p-5">
      <p className="mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{section.title}</p>
      <p className="mb-4 text-xs text-muted-foreground">{section.selectionHint}</p>

      {isCustom ? (
        <div className="space-y-3">
          <p className="font-mono text-sm text-foreground">{activeModelId || '—'}</p>
          <p className="text-xs text-muted-foreground">
            Custom model ID. Ensure it exists in your Ollama instance and supports this task type.
          </p>
          {activeModelId && (
            <a
              href={`https://ollama.com/search?q=${encodeURIComponent(activeModelId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Search on Ollama
            </a>
          )}
        </div>
      ) : (
        activeModel && (
          <div className="space-y-4">
            <div>
              <p className="text-lg font-semibold text-foreground">{activeModel.label}</p>
              <p className="text-xs text-muted-foreground">
                {activeModel.params} · {formatModelSizeGb(activeModel)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-md border border-border/70 px-2 py-1.5">
                <p className="text-[10px] text-muted-foreground">Params</p>
                <p className="text-xs font-semibold text-foreground">{modelParams ?? activeModel.params}</p>
              </div>
              <div className="rounded-md border border-border/70 px-2 py-1.5">
                <p className="text-[10px] text-muted-foreground">RAM/Disk</p>
                <p className="text-xs font-semibold text-foreground">{modelSize ?? 'n/a'}</p>
              </div>
              <div className="rounded-md border border-border/70 px-2 py-1.5">
                <p className="text-[10px] text-muted-foreground">Context</p>
                <p className="text-xs font-semibold text-foreground">
                  {modelContext ? `${Math.round(modelContext / CONTEXT_DIVISOR)}K` : 'n/a'}
                </p>
              </div>
            </div>

            {(modelFamily || quantization || modifiedAt) && (
              <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                <div>
                  <dt className="font-medium text-foreground">Family</dt>
                  <dd>{modelFamily ?? 'n/a'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Quantization</dt>
                  <dd>{quantization ?? 'n/a'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Updated</dt>
                  <dd>{modifiedAt ? new Date(modifiedAt).toLocaleDateString() : 'n/a'}</dd>
                </div>
              </dl>
            )}

            <p className="text-sm text-muted-foreground">{activeModel.description}</p>

            <Separator />

            <div className="flex flex-col gap-2">
              <a
                href={ollamaModelUrl(activeModel.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View on Ollama
              </a>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-1.5 text-xs"
                onClick={() => onCopyPull(activeModel.id)}
              >
                {copied ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-3.5 w-3.5" />
                    Copy pull command
                  </>
                )}
              </Button>

              {canPullFromDetail && (
                <Button
                  type="button"
                  size="sm"
                  className="w-full justify-center sm:w-fit"
                  onClick={() => onPull(activeModelId, ollamaBaseUrl)}
                  disabled={pullState?.status === 'pulling'}
                >
                  {pullLabel}
                </Button>
              )}
            </div>
          </div>
        )
      )}
    </div>
  )
}
