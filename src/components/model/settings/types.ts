import type { LucideIcon } from 'lucide-react'
import type { ModelConfig } from '@/lib/config/model-config'
import type { ModelOption } from '@/lib/router/types'

export type SectionId =
  | 'analyst'
  | 'explain'
  | 'test'
  | 'refactor'
  | 'commit'
  | 'translate'
  | 'docstring'
  | 'type-hints'
  | 'error-explain'
  | 'performance-hint'
  | 'naming-helper'
  | 'dead-code'
export type SectionGroupId = 'infrastructure' | 'analysis' | 'generation' | 'language'

export interface SectionDef {
  id: SectionId
  group: SectionGroupId
  icon: LucideIcon
  title: string
  subtitle: string
  selectionHint: string
  models: ModelOption[]
  configKey: keyof ModelConfig
  accent: string
}
