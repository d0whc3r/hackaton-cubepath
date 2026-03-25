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

export type PullStatus = 'idle' | 'pulling' | 'done' | 'error'

export interface PullState {
  status: PullStatus
  progress?: string
  error?: string
}

export interface RuntimeModelDetails {
  capabilities?: string[]
  contextLength?: number
  family?: string
  modifiedAt?: string
  parameterSize?: string
  quantizationLevel?: string
  sizeBytes?: number
}
