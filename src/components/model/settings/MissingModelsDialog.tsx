import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { SectionDef } from './types'

interface MissingModelsDialogProps {
  readonly open: boolean
  readonly sections: SectionDef[]
  readonly getModelId: (section: SectionDef) => string
  readonly onOpenChange: (open: boolean) => void
  readonly onInstallMissing: () => void
}

export function MissingModelsDialog({
  open,
  sections,
  getModelId,
  onOpenChange,
  onInstallMissing,
}: MissingModelsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cannot save yet</DialogTitle>
          <DialogDescription>Some selected models are not installed in your Ollama instance.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {sections.map((section) => (
            <div key={section.id} className="rounded-md border border-border px-3 py-2 text-xs">
              <span className="font-medium text-foreground">{section.title}</span>
              <span className="ml-2 font-mono text-muted-foreground">{getModelId(section)}</span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Change models
          </Button>
          <Button type="button" onClick={onInstallMissing}>
            Install missing models
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
