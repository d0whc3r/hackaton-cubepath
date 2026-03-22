import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Cpu,
  FileSearch,
  Loader2,
  Route,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

import type { RoutingStep, RoutingStepName, SpecialistInfo } from '@/lib/schemas/route'

import { Badge } from '@/components/ui/badge'

const STEP_ORDER: RoutingStepName[] = [
  'detecting_language',
  'analyzing_task',
  'selecting_specialist',
  'generating_response',
]

const STEP_ICONS: Record<RoutingStepName, React.ElementType> = {
  analyzing_task: Route,
  detecting_language: FileSearch,
  generating_response: Sparkles,
  selecting_specialist: Cpu,
}

const STEP_LABELS: Record<RoutingStepName, string> = {
  analyzing_task: 'Analyze task',
  detecting_language: 'Detect language',
  generating_response: 'Generate response',
  selecting_specialist: 'Select specialist',
}

function StepIcon({
  status,
  stepName,
}: {
  readonly status: RoutingStep['status']
  readonly stepName: RoutingStepName
}) {
  const Icon = STEP_ICONS[stepName]
  if (status === 'active') {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
  }
  if (status === 'done') {
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
  }
  if (status === 'error') {
    return <XCircle className="h-3.5 w-3.5 text-destructive" />
  }
  return <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
}

interface RoutingProgressProps {
  readonly steps: RoutingStep[]
  readonly specialist: SpecialistInfo | null
  readonly isStreaming: boolean
}

export function RoutingProgress({ steps, specialist, isStreaming }: RoutingProgressProps) {
  const [expanded, setExpanded] = useState(false)

  function handleToggle() {
    setExpanded((prev) => !prev)
  }

  const activeStep = steps.find((step) => step.status === 'active')
  const doneCount = steps.filter((step) => step.status === 'done').length
  const hasContent = steps.length > 0 || specialist !== null

  if (!hasContent) {
    return null
  }

  const statusLine = activeStep
    ? activeStep.label
    : specialist
      ? `${specialist.displayName} · ${specialist.language}`
      : `${doneCount} step${doneCount !== 1 ? 's' : ''} completed`

  return (
    <div className="mt-3 border-t border-border/40 pt-2.5">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-2 text-left transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex h-4 w-4 shrink-0 items-center justify-center">
          {isStreaming && !activeStep ? (
            <Circle className="h-3 w-3 text-muted-foreground/40" />
          ) : activeStep ? (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          ) : (
            <Zap className="h-3 w-3 text-primary" />
          )}
        </div>
        <span className="flex-1 truncate text-[11px] text-muted-foreground">{statusLine}</span>
        {expanded ? (
          <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-2.5 space-y-2 rounded-lg border border-border/40 bg-muted/20 p-3">
          {STEP_ORDER.map((stepKey) => {
            const step = steps.find((routeStep) => routeStep.step === stepKey)
            const status = step?.status ?? 'pending'
            const label = step?.label ?? STEP_LABELS[stepKey]
            const isPending = status === 'pending'

            return (
              <div key={stepKey} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex-none">
                  <StepIcon status={status} stepName={stepKey} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-[11px] ${isPending ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                    {label}
                  </span>
                  {step?.detail && status === 'done' && (
                    <span className="ml-2 rounded border border-border/50 bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {step.detail}
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {specialist && (
            <div className="mt-1 flex flex-wrap gap-1.5 border-t border-border/40 pt-2">
              <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                {specialist.displayName}
              </Badge>
              <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">
                {specialist.language}
              </Badge>
              {specialist.modelId && (
                <Badge variant="outline" className="h-5 rounded-full px-2 font-mono text-[10px]">
                  {specialist.modelId}
                </Badge>
              )}
              {specialist.reason && (
                <p className="mt-1 w-full text-[10px] text-muted-foreground">{specialist.reason}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
