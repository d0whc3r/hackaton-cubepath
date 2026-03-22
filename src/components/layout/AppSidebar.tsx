import {
  BookOpen,
  GitCommitHorizontal,
  LayoutDashboard,
  RefreshCw,
  RotateCcw,
  TestTube2,
  TrendingDown,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import type { TaskType } from '@/lib/schemas/route'
import type { SavingsData } from '@/lib/utils/savings'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { ModelConfigDialog } from '@/components/model/ModelConfigDialog'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatUsd } from '@/lib/utils/format'
import { loadSavings, resetSavings } from '@/lib/utils/savings'

const NAV_ITEMS = [{ href: '/', icon: LayoutDashboard, label: 'Overview' }] as const

const TASK_ITEMS = [
  { href: '/tasks/explain', icon: BookOpen, label: 'Explain Code' },
  { href: '/tasks/test', icon: TestTube2, label: 'Generate Tests' },
  { href: '/tasks/refactor', icon: RefreshCw, label: 'Refactor' },
  { href: '/tasks/commit', icon: GitCommitHorizontal, label: 'Write Commit' },
] as const

const EMPTY_SAVINGS: SavingsData = { queryCount: 0, totalInputTokens: 0, totalOutputTokens: 0, totalSavedUsd: 0 }
const normalizePath = (path: string) => (path === '/' ? path : path.replace(/\/+$/, ''))
const TASK_PATH_BY_TYPE: Record<TaskType, string> = {
  commit: '/tasks/commit',
  explain: '/tasks/explain',
  refactor: '/tasks/refactor',
  test: '/tasks/test',
}

interface AppSidebarProps {
  readonly fixedTaskType?: TaskType
}

export function AppSidebar({ fixedTaskType }: AppSidebarProps) {
  const [pathname, setPathname] = useState(() => normalizePath(globalThis.location?.pathname ?? '/'))
  const [savings, setSavings] = useState<SavingsData>(EMPTY_SAVINGS)
  const { state } = useSidebar()

  useEffect(() => {
    const syncPathname = () => setPathname(normalizePath(globalThis.location.pathname))
    syncPathname()
    setSavings(loadSavings())

    const onPageLoad = () => syncPathname()
    const onAfterSwap = () => syncPathname()
    const onPopState = () => syncPathname()
    const onSavings = (event: Event) => setSavings((event as CustomEvent<SavingsData>).detail)

    document.addEventListener('astro:page-load', onPageLoad)
    document.addEventListener('astro:after-swap', onAfterSwap)
    globalThis.addEventListener('popstate', onPopState)
    globalThis.addEventListener('slm-savings-updated', onSavings)
    return () => {
      document.removeEventListener('astro:page-load', onPageLoad)
      document.removeEventListener('astro:after-swap', onAfterSwap)
      globalThis.removeEventListener('popstate', onPopState)
      globalThis.removeEventListener('slm-savings-updated', onSavings)
    }
  }, [])

  const isCollapsed = state === 'collapsed'
  const activeTaskHref = fixedTaskType ? TASK_PATH_BY_TYPE[fixedTaskType] : null
  const hasSavings = savings.queryCount > 0

  const handleResetSavings = () => {
    if (!hasSavings) {
      return
    }
    const shouldReset = globalThis.confirm('Reset cumulative savings?')
    if (!shouldReset) {
      return
    }
    resetSavings()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                  <img
                    src="/logo-nobg.png"
                    alt="SLM Router logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-semibold">SLM Router</span>
                  <span className="text-[10px] text-muted-foreground">Local AI routing</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={fixedTaskType ? false : pathname === item.href}
                    tooltip={item.label}
                  >
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Tasks</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {TASK_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      activeTaskHref
                        ? activeTaskHref === item.href
                        : pathname === item.href || pathname.startsWith(`${item.href}/`)
                    }
                    tooltip={item.label}
                  >
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between gap-2">
            <span>Savings</span>
            <button
              type="button"
              onClick={handleResetSavings}
              disabled={!hasSavings}
              className="inline-flex h-5 items-center gap-1 rounded px-1 text-[10px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Reset savings"
              title="Reset savings"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="group-data-[collapsible=icon]:hidden">Reset</span>
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      className={
                        hasSavings
                          ? 'h-auto cursor-default text-green-600 hover:bg-green-500/10 hover:text-green-600 dark:text-green-400 dark:hover:text-green-400'
                          : 'h-auto cursor-default text-muted-foreground hover:bg-muted'
                      }
                    >
                      <TrendingDown className={hasSavings ? 'shrink-0 text-green-500' : 'shrink-0'} />
                      <div className="flex min-w-0 flex-col">
                        <span className="font-mono text-sm leading-tight font-bold">
                          {formatUsd(savings.totalSavedUsd)}
                        </span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {hasSavings ? `${savings.queryCount} querie/s saved` : 'No savings yet'}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" hidden={!isCollapsed} className="text-xs">
                    <p className="font-semibold">Saved {formatUsd(savings.totalSavedUsd)} vs cloud</p>
                    <p className="text-muted-foreground">
                      {savings.queryCount} {savings.queryCount === 1 ? 'query' : 'queries'} ·{' '}
                      {savings.totalInputTokens.toLocaleString()}↑ {savings.totalOutputTokens.toLocaleString()}↓ tokens
                    </p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 pt-2">
        <div
          className={
            isCollapsed
              ? 'flex w-full flex-col items-center gap-2'
              : 'flex w-full flex-row flex-nowrap items-center justify-start gap-2'
          }
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={isCollapsed ? 'flex justify-center' : 'flex justify-start'}>
                <ModelConfigDialog />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" hidden={!isCollapsed} className="text-xs">
              Settings
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className={isCollapsed ? 'flex justify-center' : 'flex justify-start'}>
                <ThemeToggle />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" hidden={!isCollapsed} className="text-xs">
              Toggle Theme
            </TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
