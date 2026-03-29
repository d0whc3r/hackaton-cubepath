import {
  AlertCircle,
  BookOpen,
  Bot,
  FileText,
  GitCommitHorizontal,
  Languages,
  RefreshCw,
  Tag,
  TestTube2,
  Trash2,
  Type,
  Zap,
} from 'lucide-react'
import type { ModelRuntime } from '@/lib/router/types'
import { ANALYST_MODELS_BY_RUNTIME, MODELS_BY_TASK_BY_RUNTIME, TRANSLATE_MODELS_BY_RUNTIME } from '@/lib/router/models'
import type { SectionDef } from './types'

export const CUSTOM_VALUE = '__custom__'

interface SectionTemplate {
  accent: string
  configKey: SectionDef['configKey']
  group: SectionDef['group']
  icon: SectionDef['icon']
  id: SectionDef['id']
  selectionHint: string
  subtitle: string
  title: string
}

const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    accent: 'border-primary/40',
    configKey: 'analystModel',
    group: 'infrastructure',
    icon: Bot,
    id: 'analyst',
    selectionHint: 'Pick fast + reliable JSON output. Analyst runs on every request.',
    subtitle: 'Runs first: language detection, framework detection, and diff analysis.',
    title: 'Analyst',
  },
  {
    accent: 'border-border/70',
    configKey: 'explainModel',
    group: 'analysis',
    icon: BookOpen,
    id: 'explain',
    selectionHint: 'Prioritize instruction following and long context for full-file explanations.',
    subtitle: 'Code explanation and technical documentation.',
    title: 'Explain Code',
  },
  {
    accent: 'border-border/70',
    configKey: 'errorExplainModel',
    group: 'analysis',
    icon: AlertCircle,
    id: 'error-explain',
    selectionHint: 'Prioritize instruction-following models for clear root-cause explanations.',
    subtitle: 'Root-cause analysis and numbered fix steps for error messages.',
    title: 'Error Explain',
  },
  {
    accent: 'border-border/70',
    configKey: 'performanceHintModel',
    group: 'analysis',
    icon: Zap,
    id: 'performance-hint',
    selectionHint: 'Prefer coder models with larger context for thorough optimization analysis.',
    subtitle: 'Advisory bullet list of non-breaking performance optimization suggestions.',
    title: 'Performance Hint',
  },
  {
    accent: 'border-border/70',
    configKey: 'deadCodeModel',
    group: 'analysis',
    icon: Trash2,
    id: 'dead-code',
    selectionHint: 'Prefer coder models for accurate detection of unused symbols.',
    subtitle: 'Identifies unused imports, unreachable code, and redundant variables.',
    title: 'Dead Code',
  },
  {
    accent: 'border-border/70',
    configKey: 'namingHelperModel',
    group: 'analysis',
    icon: Tag,
    id: 'naming-helper',
    selectionHint: 'Instruction-following models produce cleaner before → after rename lists.',
    subtitle: 'Structured before → after rename list with one-line rationale per entry.',
    title: 'Naming Helper',
  },
  {
    accent: 'border-border/70',
    configKey: 'testModel',
    group: 'generation',
    icon: TestTube2,
    id: 'test',
    selectionHint: 'Prioritize code-specialist models for stronger edge-case coverage.',
    subtitle: 'Unit and integration test generation.',
    title: 'Generate Tests',
  },
  {
    accent: 'border-border/70',
    configKey: 'refactorModel',
    group: 'generation',
    icon: RefreshCw,
    id: 'refactor',
    selectionHint: 'Prefer coder models with larger context to avoid truncating full files.',
    subtitle: 'Cleanup, idiomatic rewrites, and structural code changes.',
    title: 'Refactor',
  },
  {
    accent: 'border-border/70',
    configKey: 'commitModel',
    group: 'generation',
    icon: GitCommitHorizontal,
    id: 'commit',
    selectionHint: 'Small instruction-following models are usually enough for commit summaries.',
    subtitle: 'Conventional commit message generation from diffs.',
    title: 'Write Commit',
  },
  {
    accent: 'border-border/70',
    configKey: 'docstringModel',
    group: 'generation',
    icon: FileText,
    id: 'docstring',
    selectionHint: 'Instruction-following models produce accurate, complete documentation.',
    subtitle: 'Add or update documentation comments without changing any logic.',
    title: 'Docstring',
  },
  {
    accent: 'border-border/70',
    configKey: 'typeHintsModel',
    group: 'generation',
    icon: Type,
    id: 'type-hints',
    selectionHint: 'Prefer coder models for accurate type inference without logic changes.',
    subtitle: 'Add type annotations to parameters and return values without changing logic.',
    title: 'Type Hints',
  },
  {
    accent: 'border-blue-500/40',
    configKey: 'translateModel',
    group: 'language',
    icon: Languages,
    id: 'translate',
    selectionHint: 'Use dedicated translation models unless you need in-block code translation.',
    subtitle: 'Translation to 37 languages. Code blocks remain unchanged by default.',
    title: 'Translation',
  },
]

function modelsForSection(id: SectionDef['id'], modelRuntime: ModelRuntime): SectionDef['models'] {
  if (id === 'analyst') {
    return ANALYST_MODELS_BY_RUNTIME[modelRuntime]
  }
  if (id === 'translate') {
    return TRANSLATE_MODELS_BY_RUNTIME[modelRuntime]
  }

  return MODELS_BY_TASK_BY_RUNTIME[modelRuntime][id]
}

export function getSectionsForRuntime(modelRuntime: ModelRuntime): SectionDef[] {
  return SECTION_TEMPLATES.map((template) => ({
    ...template,
    models: modelsForSection(template.id, modelRuntime),
  }))
}

export const SECTIONS: SectionDef[] = getSectionsForRuntime('local')
