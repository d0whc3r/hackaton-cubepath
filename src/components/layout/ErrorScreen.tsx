import { AlertTriangle, ArrowLeft, Home, LifeBuoy, RotateCcw, Settings2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'

interface ErrorAction {
  href: string
  label: string
  variant?: 'default' | 'outline' | 'secondary'
  icon?: 'home' | 'back' | 'retry' | 'settings'
}

interface ErrorScreenProps {
  code: string
  title: string
  description: string
  hint: string
  actions: ErrorAction[]
}

const iconByAction = {
  back: ArrowLeft,
  home: Home,
  retry: RotateCcw,
  settings: Settings2,
} as const

export function ErrorScreen({ code, title, description, hint, actions }: ErrorScreenProps) {
  return (
    <section className="mx-auto w-full max-w-3xl py-10 md:py-14">
      <Card className="border border-border/70 bg-card/80 backdrop-blur-sm">
        <CardHeader className="gap-4">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="destructive">{code}</Badge>
            <Badge variant="outline">System status</Badge>
          </div>
          <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <Empty className="rounded-xl border-border/70 bg-background/50 p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertTriangle className="size-5 text-destructive" />
              </EmptyMedia>
              <EmptyTitle className="text-xl">{title}</EmptyTitle>
              <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Alert variant="destructive" className="text-left">
                <LifeBuoy />
                <AlertTitle>Recommended action</AlertTitle>
                <AlertDescription>{hint}</AlertDescription>
              </Alert>
            </EmptyContent>
          </Empty>
        </CardContent>

        <Separator />

        <CardFooter className="flex flex-wrap justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            SLM Router keeps your local configuration and task mappings intact.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((action) => {
              const Icon = action.icon ? iconByAction[action.icon] : null
              return (
                <Button key={action.href + action.label} asChild variant={action.variant ?? 'outline'}>
                  <a href={action.href}>
                    {Icon ? <Icon className="size-4" /> : null}
                    {action.label}
                  </a>
                </Button>
              )
            })}
          </div>
        </CardFooter>
      </Card>
    </section>
  )
}
