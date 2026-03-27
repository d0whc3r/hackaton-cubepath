import { Badge } from '@/components/ui/badge'
import type { SectionDef } from './types'

interface SectionCardButtonProps {
  section: SectionDef
  selected: boolean
  modelId: string
  installed: boolean
  onSelectSection: (section: SectionDef) => void
}

function SectionCardButton({ section, selected, modelId, installed, onSelectSection }: SectionCardButtonProps) {
  function handleClick() {
    onSelectSection(section)
  }

  let borderClass = 'border-border hover:border-primary/40'
  if (!installed) {
    borderClass = 'border-2 border-destructive hover:border-destructive'
  } else if (selected) {
    borderClass = 'border-primary'
  }

  return (
    <button
      key={section.id}
      type="button"
      onClick={handleClick}
      className={[
        'min-w-44 rounded-lg border px-3 py-2 text-left transition-colors',
        borderClass,
        selected ? 'text-foreground' : 'text-muted-foreground',
      ].join(' ')}
      aria-pressed={selected}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{section.title}</span>
        <Badge variant={installed ? 'outline' : 'secondary'} className="text-[10px]">
          {installed ? 'Installed' : 'Not installed'}
        </Badge>
      </div>
      <p className="mt-1 truncate text-[11px]">{modelId || 'No model selected'}</p>
    </button>
  )
}

interface SectionCardsStripProps {
  sections: SectionDef[]
  activeSectionId: string
  getModelId: (section: SectionDef) => string
  isInstalled: (modelId: string) => boolean
  onSelectSection: (section: SectionDef) => void
}

export function SectionCardsStrip({
  sections,
  activeSectionId,
  getModelId,
  isInstalled,
  onSelectSection,
}: SectionCardsStripProps) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {sections.map((section) => (
        <SectionCardButton
          key={section.id}
          section={section}
          selected={section.id === activeSectionId}
          modelId={getModelId(section)}
          installed={isInstalled(getModelId(section))}
          onSelectSection={onSelectSection}
        />
      ))}
    </div>
  )
}
