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

import { getModelForTask, loadModelConfig } from '@/lib/config/model-config'
import { MODELS_BY_TASK } from '@/lib/router/models'

interface TaskCard {
  color: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  specialist: string
  task: TaskType
  title: string
}

const ANALYSIS_TASKS: TaskCard[] = [
  {
    color: 'text-blue-500',
    description:
      "Get a senior-level explanation of any code — what it does, why it's structured that way, and potential pitfalls.",
    href: '/tasks/explain',
    icon: BookOpen,
    iconBg: 'bg-blue-500/10',
    specialist: 'Explanation specialist',
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
    specialist: 'Error explain specialist',
    task: 'error-explain',
    title: 'Error Explain',
  },
  {
    color: 'text-yellow-500',
    description: 'Get an advisory bullet list of non-breaking performance optimization suggestions for your code.',
    href: '/tasks/performance-hint',
    icon: Zap,
    iconBg: 'bg-yellow-500/10',
    specialist: 'Performance hint specialist',
    task: 'performance-hint',
    title: 'Performance Hint',
  },
  {
    color: 'text-red-500',
    description: 'Identify unused imports, unreachable code, and redundant variables in your file or fragment.',
    href: '/tasks/dead-code',
    icon: Trash2,
    iconBg: 'bg-red-500/10',
    specialist: 'Dead code specialist',
    task: 'dead-code',
    title: 'Dead Code',
  },
  {
    color: 'text-amber-500',
    description: 'Get a structured before → after rename list with rationale for unclear variable and function names.',
    href: '/tasks/naming-helper',
    icon: Tag,
    iconBg: 'bg-amber-500/10',
    specialist: 'Naming helper specialist',
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
    specialist: 'Test specialist',
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
    specialist: 'Refactor specialist',
    task: 'refactor',
    title: 'Refactor Code',
  },
  {
    color: 'text-orange-500',
    description: 'Turn a git diff or description into a clear, imperative commit message.',
    href: '/tasks/commit',
    icon: GitCommitHorizontal,
    iconBg: 'bg-orange-500/10',
    specialist: 'Commit specialist',
    task: 'commit',
    title: 'Write Commit',
  },
  {
    color: 'text-teal-500',
    description:
      'Add or update documentation comments covering parameters, return values, and purpose — logic unchanged.',
    href: '/tasks/docstring',
    icon: FileText,
    iconBg: 'bg-teal-500/10',
    specialist: 'Docstring specialist',
    task: 'docstring',
    title: 'Docstring',
  },
  {
    color: 'text-cyan-500',
    description: 'Add type annotations to all parameters and return values without changing any logic.',
    href: '/tasks/type-hints',
    icon: Type,
    iconBg: 'bg-cyan-500/10',
    specialist: 'Type hints specialist',
    task: 'type-hints',
    title: 'Type Hints',
  },
]

function TaskCardGrid({ tasks, modelConfig }: { tasks: TaskCard[]; modelConfig: ReturnType<typeof loadModelConfig> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map(({ task, href, icon: Icon, iconBg, color, title, description, specialist }) => {
        const modelId = getModelForTask(modelConfig, task)
        const modelLabel = MODELS_BY_TASK[task].find((model) => model.id === modelId)?.label ?? modelId

        return (
          <a
            key={task}
            href={href}
            className="group rounded-xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mb-1.5 font-semibold text-foreground transition-colors group-hover:text-primary">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono">{modelLabel}</span>
              <span>·</span>
              <span>{specialist}</span>
            </div>
          </a>
        )
      })}
    </div>
  )
}

export function OverviewTaskCards() {
  const [modelConfig, setModelConfig] = useState(loadModelConfig)

  useEffect(() => {
    const handler = () => setModelConfig(loadModelConfig())
    globalThis.addEventListener('storage', handler)
    return () => globalThis.removeEventListener('storage', handler)
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Analysis</h2>
        <TaskCardGrid tasks={ANALYSIS_TASKS} modelConfig={modelConfig} />
      </section>
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Generation</h2>
        <TaskCardGrid tasks={GENERATION_TASKS} modelConfig={modelConfig} />
      </section>
    </div>
  )
}
