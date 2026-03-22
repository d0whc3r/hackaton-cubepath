import { ANALYST_MODELS, MODELS_BY_TASK, TRANSLATE_MODELS } from '@/lib/router/models'

import type { SectionDef } from './types'

export const CONTEXT_DIVISOR = 1024
export const CUSTOM_VALUE = '__custom__'

export const SECTIONS: SectionDef[] = [
  {
    accent: 'border-primary/40',
    configKey: 'analystModel',
    group: 'management',
    id: 'analyst',
    models: ANALYST_MODELS,
    selectionHint: 'Pick fast + reliable JSON output. Analyst runs on every request.',
    subtitle: 'Runs first: language detection, framework detection, and diff analysis.',
    title: 'Analyst',
  },
  {
    accent: 'border-border/70',
    configKey: 'explainModel',
    group: 'code',
    id: 'explain',
    models: MODELS_BY_TASK.explain,
    selectionHint: 'Prioritize instruction following and long context for full-file explanations.',
    subtitle: 'Code explanation and technical documentation.',
    title: 'Explain Code',
  },
  {
    accent: 'border-border/70',
    configKey: 'testModel',
    group: 'code',
    id: 'test',
    models: MODELS_BY_TASK.test,
    selectionHint: 'Prioritize code-specialist models for stronger edge-case coverage.',
    subtitle: 'Unit and integration test generation.',
    title: 'Generate Tests',
  },
  {
    accent: 'border-border/70',
    configKey: 'refactorModel',
    group: 'code',
    id: 'refactor',
    models: MODELS_BY_TASK.refactor,
    selectionHint: 'Prefer coder models with larger context to avoid truncating full files.',
    subtitle: 'Cleanup, idiomatic rewrites, and structural code changes.',
    title: 'Refactor',
  },
  {
    accent: 'border-border/70',
    configKey: 'commitModel',
    group: 'management',
    id: 'commit',
    models: MODELS_BY_TASK.commit,
    selectionHint: 'Small instruction-following models are usually enough for commit summaries.',
    subtitle: 'Conventional commit message generation from diffs.',
    title: 'Write Commit',
  },
  {
    accent: 'border-blue-500/40',
    configKey: 'translateModel',
    group: 'language',
    id: 'translate',
    models: TRANSLATE_MODELS,
    selectionHint: 'Use dedicated translation models unless you need in-block code translation.',
    subtitle: 'Translation to 37 languages. Code blocks remain unchanged by default.',
    title: 'Translation',
  },
]
