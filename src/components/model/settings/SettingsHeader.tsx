import { ArrowLeft, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface SettingsHeaderProps {
  readonly onBack: () => void
  readonly onReset: () => void
  readonly onSave: () => void
}

export function SettingsHeader({ onBack, onReset, onSave }: SettingsHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Separator orientation="vertical" className="h-5" />

        <h1 className="flex-1 text-sm font-semibold">Settings</h1>

        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button type="button" size="sm" onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
    </header>
  )
}
