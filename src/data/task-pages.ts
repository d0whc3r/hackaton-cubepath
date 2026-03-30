import type { TaskType } from '@/lib/schemas/route'

interface TaskPageMeta {
  slug: string
  fixedTaskType: TaskType
  title: string
  description: string
  pageTitle: string
  pageDescription: string
}

export const taskPages: TaskPageMeta[] = [
  {
    description: 'Generate focused commit messages from diffs or change descriptions.',
    fixedTaskType: 'commit',
    pageDescription: 'Generate a focused 1-2 line commit message from your diff or description.',
    pageTitle: 'Write Commit',
    slug: 'commit',
    title: 'Write Commit',
  },
  {
    description: 'Identify unused imports, unreachable code, and redundant variables in your file or fragment.',
    fixedTaskType: 'dead-code',
    pageDescription: 'Identify unused imports, unreachable code, and redundant variables in your file or fragment.',
    pageTitle: 'Dead Code',
    slug: 'dead-code',
    title: 'Dead Code',
  },
  {
    description:
      'Generate or update documentation comments. Paste your code and an optional description of what the module does.',
    fixedTaskType: 'docstring',
    pageDescription: 'Generate or update documentation comments without changing any logic.',
    pageTitle: 'Docstring',
    slug: 'docstring',
    title: 'Docstring',
  },
  {
    description: 'Paste an error message and optional code snippet to get a root-cause explanation and fix steps.',
    fixedTaskType: 'error-explain',
    pageDescription: 'Paste an error message and optional code snippet to get a root-cause explanation.',
    pageTitle: 'Error Explain',
    slug: 'error-explain',
    title: 'Error Explain',
  },
  {
    description: 'Get a structured senior-level explanation of any code snippet. Powered by local AI.',
    fixedTaskType: 'explain',
    pageDescription: 'Analyze code behavior with a direct senior-level explanation.',
    pageTitle: 'Explain Code',
    slug: 'explain',
    title: 'Explain Code',
  },
  {
    description: 'Get rename suggestions for unclear variables and functions as a before → after list.',
    fixedTaskType: 'naming-helper',
    pageDescription: 'Get rename suggestions for unclear variables and functions as a before → after list.',
    pageTitle: 'Naming Helper',
    slug: 'naming-helper',
    title: 'Naming Helper',
  },
  {
    description: 'Get advisory optimization suggestions for your code without changing any behavior.',
    fixedTaskType: 'performance-hint',
    pageDescription: 'Get advisory optimization suggestions for your code without changing any behavior.',
    pageTitle: 'Performance Hint',
    slug: 'performance-hint',
    title: 'Performance Hint',
  },
  {
    description: 'Improve code structure and readability while preserving behavior.',
    fixedTaskType: 'refactor',
    pageDescription: 'Improve structure and readability while preserving behavior.',
    pageTitle: 'Refactor Code',
    slug: 'refactor',
    title: 'Refactor Code',
  },
  {
    description: 'Generate practical test suites for your code. Supports Vitest, Jest, pytest, and more.',
    fixedTaskType: 'test',
    pageDescription: 'Create practical test suites and edge cases for your code.',
    pageTitle: 'Generate Tests',
    slug: 'test',
    title: 'Generate Tests',
  },
  {
    description: 'Add type annotations to your functions and parameters without changing any logic.',
    fixedTaskType: 'type-hints',
    pageDescription: 'Add type annotations to your functions and parameters without changing any logic.',
    pageTitle: 'Type Hints',
    slug: 'type-hints',
    title: 'Type Hints',
  },
]

export const taskPageBySlug = Object.fromEntries(taskPages.map((taskPage) => [taskPage.slug, taskPage])) as Record<
  string,
  TaskPageMeta
>
