import { buildCommitPrompt } from '@/lib/prompts/commit'
import { buildExplainPrompt } from '@/lib/prompts/explain'
import { buildRefactorPrompt } from '@/lib/prompts/refactor'
import { buildTestPrompt } from '@/lib/prompts/test'
import type { CodeContext, SpecialistConfig, TaskType } from './types'

export interface SpecialistEnv {
  explainModel: string
  testModel?: string
  refactorModel?: string
  commitModel?: string
}

function inferTestFramework(language: string): string | null {
  const map: Record<string, string> = {
    go: 'Go testing package',
    java: 'JUnit',
    javascript: 'Vitest',
    kotlin: 'JUnit',
    python: 'pytest',
    ruby: 'RSpec',
    rust: 'Rust built-in test attribute',
    typescript: 'Vitest',
  }
  return map[language.toLowerCase()] ?? null
}

export function buildSpecialists(env: SpecialistEnv): Record<TaskType, SpecialistConfig> {
  return {
    commit: {
      buildSystemPrompt: (context: CodeContext, input: string) => {
        const enriched = {
          ...context,
          isDiff: context.isDiff || /^diff --git|^@@\s/.test(input.trimStart()),
        }
        return buildCommitPrompt(enriched)
      },
      displayName: 'Commit Specialist',
      id: 'commit-specialist',
      modelId: env.commitModel ?? '',
    },
    explain: {
      buildSystemPrompt: (context: CodeContext) => buildExplainPrompt(context),
      displayName: 'Explanation Specialist',
      id: 'explanation-specialist',
      modelId: env.explainModel,
    },
    refactor: {
      buildSystemPrompt: (context: CodeContext) => buildRefactorPrompt(context),
      displayName: 'Refactor Specialist',
      id: 'refactor-specialist',
      modelId: env.refactorModel ?? '',
    },
    test: {
      buildSystemPrompt: (context: CodeContext) => {
        const enriched = {
          ...context,
          testFramework: context.testFramework ?? inferTestFramework(context.language),
        }
        return buildTestPrompt(enriched)
      },
      displayName: 'Test Specialist',
      id: 'test-specialist',
      modelId: env.testModel ?? '',
    },
  }
}
