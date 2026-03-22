import type { TaskType } from '@/lib/schemas/route'

import { AppProviders } from '@/components/AppProviders'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

interface TaskAppProps {
  readonly fixedTaskType?: TaskType
  readonly pageTitle?: string
  readonly pageDescription?: string
}

export function TaskApp({ fixedTaskType, pageTitle, pageDescription }: TaskAppProps) {
  return (
    <AppProviders>
      <SidebarProvider className="h-screen overflow-hidden">
        <AppSidebar fixedTaskType={fixedTaskType} />
        <SidebarInset className="flex h-full flex-col overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4" />
            {pageTitle && (
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{pageTitle}</span>
                {pageDescription && (
                  <span className="hidden truncate text-[11px] text-muted-foreground sm:block">{pageDescription}</span>
                )}
              </div>
            )}
          </header>
          {/* Min-h-0 is critical: lets this flex child shrink below content height */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ChatContainer fixedTaskType={fixedTaskType} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AppProviders>
  )
}
