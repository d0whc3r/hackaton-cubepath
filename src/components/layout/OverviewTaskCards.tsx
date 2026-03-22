import { BookOpen, GitCommitHorizontal, RefreshCw, TestTube2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { TaskType } from '@/lib/schemas/route'

import { getModelForTask, loadModelConfig } from '@/lib/config/model-config'
import { MODELS_BY_TASK } from '@/lib/router/models'

const TASKS = [
  {
    color: 'text-blue-500',
    description:
      "Get a senior-level explanation of any code — what it does, why it's structured that way, and potential pitfalls.",
    href: '/tasks/explain',
    icon: BookOpen,
    iconBg: 'bg-blue-500/10',
    specialist: 'Explanation specialist',
    task: 'explain' as TaskType,
    title: 'Explain Code',
  },
  {
    color: 'text-green-500',
    description:
      'Generate comprehensive tests with edge cases. Auto-detects your framework (Vitest, pytest, JUnit, etc.).',
    href: '/tasks/test',
    icon: TestTube2,
    iconBg: 'bg-green-500/10',
    specialist: 'Test specialist',
    task: 'test' as TaskType,
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
    task: 'refactor' as TaskType,
    title: 'Refactor Code',
  },
  {
    color: 'text-orange-500',
    description: 'Turn a git diff or description into a clear, imperative commit message.',
    href: '/tasks/commit',
    icon: GitCommitHorizontal,
    iconBg: 'bg-orange-500/10',
    specialist: 'Commit specialist',
    task: 'commit' as TaskType,
    title: 'Write Commit',
  },
]

export function OverviewTaskCards() {
  const [modelConfig, setModelConfig] = useState(loadModelConfig)

  useEffect(() => {
    // Re-read config when storage changes (e.g. user saved in another tab)
    const handler = () => setModelConfig(loadModelConfig())
    globalThis.addEventListener('storage', handler)
    return () => globalThis.removeEventListener('storage', handler)
  }, [])

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {TASKS.map(({ task, href, icon: Icon, iconBg, color, title, description, specialist }) => {
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
