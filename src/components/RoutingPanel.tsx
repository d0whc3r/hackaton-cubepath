import type { RoutingStep } from '../lib/router/types'

interface SpecialistBadge {
  displayName: string
  language: string
}

interface RoutingPanelProps {
  steps: RoutingStep[]
  specialist: SpecialistBadge | null
}

export function RoutingPanel({ steps, specialist }: Readonly<RoutingPanelProps>) {
  if (steps.length === 0 && !specialist) {
    return null
  }

  return (
    <div>
      {steps.map((step) => (
        <div key={step.step} className="flex items-center gap-2">
          {step.status === 'active' && <span className="animate-spin">⏳</span>}
          {step.status === 'done' && <span>✓</span>}
          {step.status === 'error' && <span>✗</span>}
          <span>{step.label}</span>
        </div>
      ))}

      {specialist && (
        <div className="mt-2">
          <span className="font-semibold">{specialist.displayName}</span>
          <span className="ml-2 text-muted-foreground">{specialist.language}</span>
        </div>
      )}
    </div>
  )
}
