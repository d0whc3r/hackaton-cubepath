import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export function ComposerTextarea({ className, ...props }: Readonly<React.ComponentProps<'textarea'>>) {
  return (
    <Textarea className={cn('resize-none overflow-y-auto font-mono text-xs leading-relaxed', className)} {...props} />
  )
}
