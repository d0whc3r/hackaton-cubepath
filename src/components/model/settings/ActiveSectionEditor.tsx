import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SectionDef } from './types'
import { formatModelSizeGb } from './helpers'

interface ActiveSectionEditorProps {
  section: SectionDef
  selectValue: string
  defaultModelId: string
  customValue: string
  isCustom: boolean
  onModelChange: (value: string) => void
  onCustomModelChange: (value: string) => void
}

export function ActiveSectionEditor({
  section,
  selectValue,
  defaultModelId,
  customValue,
  isCustom,
  onModelChange,
  onCustomModelChange,
}: ActiveSectionEditorProps) {
  return (
    <div className="mb-5 space-y-3 border-b border-border/70 pb-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
        <p className="text-xs text-muted-foreground">{section.subtitle}</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Model</Label>
        <Select value={selectValue} onValueChange={onModelChange}>
          <SelectTrigger className="h-9 w-full text-sm">
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
            <SelectItem value="__custom__" className="text-xs text-muted-foreground">
              Custom model ID...
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isCustom && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Custom model ID</Label>
          <Input
            value={customValue}
            onChange={(event) => onCustomModelChange(event.target.value)}
            placeholder="e.g. my-custom-model:latest"
            className="h-9 font-mono text-xs"
          />
        </div>
      )}
    </div>
  )
}
