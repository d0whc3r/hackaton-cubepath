import {
  AlertCircle,
  BookOpen,
  FileText,
  GitCommitHorizontal,
  RefreshCw,
  Tag,
  TestTube2,
  Trash2,
  Type,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { TaskType } from '@/lib/schemas/route'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MODEL_CONFIG_UPDATED_EVENT, STORAGE_KEY, getModelForTask, loadModelConfig } from '@/lib/config/model-config'
import { MODELS_BY_TASK } from '@/lib/router/models'

interface TaskCard {
  color: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  task: TaskType
  title: string
}

const ANALYSIS_TASKS: TaskCard[] = [
  {
    color: 'text-blue-500',
    description:
      "Get a senior-level explanation of any code; what it does, why it's structured that way, and potential pitfalls.",
    href: '/tasks/explain',
    icon: BookOpen,
    iconBg: 'bg-blue-500/10',
    task: 'explain',
    title: 'Explain Code',
  },
  {
    color: 'text-rose-500',
    description:
      'Paste an error message and optional code snippet to get a root-cause explanation and numbered fix steps.',
    href: '/tasks/error-explain',
    icon: AlertCircle,
    iconBg: 'bg-rose-500/10',
    task: 'error-explain',
    title: 'Error Explain',
  },
  {
    color: 'text-yellow-500',
    description: 'Get an advisory bullet list of non-breaking performance optimization suggestions for your code.',
    href: '/tasks/performance-hint',
    icon: Zap,
    iconBg: 'bg-yellow-500/10',
    task: 'performance-hint',
    title: 'Performance Hint',
  },
  {
    color: 'text-red-500',
    description: 'Identify unused imports, unreachable code, and redundant variables in your file or fragment.',
    href: '/tasks/dead-code',
    icon: Trash2,
    iconBg: 'bg-red-500/10',
    task: 'dead-code',
    title: 'Dead Code',
  },
  {
    color: 'text-amber-500',
    description: 'Get a structured before → after rename list with rationale for unclear variable and function names.',
    href: '/tasks/naming-helper',
    icon: Tag,
    iconBg: 'bg-amber-500/10',
    task: 'naming-helper',
    title: 'Naming Helper',
  },
]

const GENERATION_TASKS: TaskCard[] = [
  {
    color: 'text-green-500',
    description:
      'Generate comprehensive tests with edge cases. Auto-detects your framework (Vitest, pytest, JUnit, etc.).',
    href: '/tasks/test',
    icon: TestTube2,
    iconBg: 'bg-green-500/10',
    task: 'test',
    title: 'Generate Tests',
  },
  {
    color: 'text-purple-500',
    description:
      'Clean up your code using idiomatic patterns. Improves readability while preserving behavior and tests.',
    href: '/tasks/refactor',
    icon: RefreshCw,
    iconBg: 'bg-purple-500/10',
    task: 'refactor',
    title: 'Refactor Code',
  },
  {
    color: 'text-orange-500',
    description: 'Turn a git diff or description into a clear, imperative commit message.',
    href: '/tasks/commit',
    icon: GitCommitHorizontal,
    iconBg: 'bg-orange-500/10',
    task: 'commit',
    title: 'Write Commit',
  },
  {
    color: 'text-teal-500',
    description:
      'Add or update documentation comments covering parameters, return values, and purpose; logic unchanged.',
    href: '/tasks/docstring',
    icon: FileText,
    iconBg: 'bg-teal-500/10',
    task: 'docstring',
    title: 'Docstring',
  },
  {
    color: 'text-cyan-500',
    description: 'Add type annotations to all parameters and return values without changing any logic.',
    href: '/tasks/type-hints',
    icon: Type,
    iconBg: 'bg-cyan-500/10',
    task: 'type-hints',
    title: 'Type Hints',
  },
]

function TaskCardGrid({
  tasks,
  modelConfig,
}: Readonly<{ tasks: TaskCard[]; modelConfig: ReturnType<typeof loadModelConfig> }>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tasks.map(({ task, href, icon: Icon, iconBg, color, title, description }, index) => {
        const modelId = getModelForTask(modelConfig, task)
        const modelLabel = MODELS_BY_TASK[task].find((model) => model.id === modelId)?.label ?? modelId

        return (
          <a
            key={task}
            href={href}
            className="group scroll-reveal-fast block"
            style={{ animationDelay: `${120 + index * 90}ms` }}
          >
            <Card
              size="sm"
              className="h-full border border-border/70 shadow-sm ring-0 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md"
            >
              <CardHeader>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${iconBg} ${color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-foreground transition-colors group-hover:text-primary">
                  {title}
                </CardTitle>
                <CardDescription className="leading-6">{description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 font-mono text-xs text-primary">
                  {modelLabel}
                </span>
              </CardFooter>
            </Card>
          </a>
        )
      })}
    </div>
  )
}

function OverviewTaskCardsContent() {
  const [modelConfig, setModelConfig] = useState(loadModelConfig)

  useEffect(() => {
    const refresh = () => setModelConfig(loadModelConfig())
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return
      }
      refresh()
    }
    globalThis.addEventListener('storage', onStorage)
    globalThis.addEventListener(MODEL_CONFIG_UPDATED_EVENT, refresh)
    return () => {
      globalThis.removeEventListener('storage', onStorage)
      globalThis.removeEventListener(MODEL_CONFIG_UPDATED_EVENT, refresh)
    }
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Analysis workflows</h2>
        <TaskCardGrid tasks={ANALYSIS_TASKS} modelConfig={modelConfig} />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Generation workflows</h2>
        <TaskCardGrid tasks={GENERATION_TASKS} modelConfig={modelConfig} />
      </section>
    </div>
  )
}

export function OverviewTaskCards() {
  return (
    <AppErrorBoundary boundaryName="layout.overview-task-cards" variant="inline">
      <OverviewTaskCardsContent />
    </AppErrorBoundary>
  )
}
