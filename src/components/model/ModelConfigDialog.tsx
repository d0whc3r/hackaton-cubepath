import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ModelConfigDialog() {
  return (
    <Button type="button" variant="ghost" size="icon" aria-label="Configure models" asChild>
      <a href="/settings">
        <Settings className="h-4 w-4" />
      </a>
    </Button>
  )
}
