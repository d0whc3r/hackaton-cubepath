import { Send, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ComposerSubmitControlsProps {
  isLoading: boolean
  onCancel: () => void
  onSubmit: () => void
  submitDisabled?: boolean
  sendTooltip?: string
  showShortcutHint?: boolean
}

export function ComposerSubmitControls({
  isLoading,
  onCancel,
  onSubmit,
  submitDisabled = false,
  sendTooltip,
  showShortcutHint = true,
}: ComposerSubmitControlsProps) {
  if (isLoading) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-8 gap-1.5">
        <Square className="h-3 w-3 fill-current" />
        Stop
      </Button>
    )
  }

  const submitButton = (
    <Button type="button" size="sm" onClick={onSubmit} disabled={submitDisabled} className="h-8 gap-1.5">
      <Send className="h-3.5 w-3.5" />
      Send
      {showShortcutHint && (
        <kbd className="hidden rounded border border-primary-foreground/30 px-1 py-0.5 font-mono text-[9px] opacity-70 sm:inline">
          ⌘↵
        </kbd>
      )}
    </Button>
  )

  if (!sendTooltip) {
    return submitButton
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{submitButton}</TooltipTrigger>
      <TooltipContent>
        <p>{sendTooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
