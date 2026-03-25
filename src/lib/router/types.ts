export type TaskType =
  | 'explain'
  | 'test'
  | 'refactor'
  | 'commit'
  | 'docstring'
  | 'type-hints'
  | 'error-explain'
  | 'performance-hint'
  | 'naming-helper'
  | 'dead-code'

export interface ModelOption {
  id: string
  label: string
  params: string
  /** Model size in GB as float (e.g. 1.3, 0.398). */
  size: number
  description: string
  /** Context window in tokens (e.g. 8192, 32768, 131072) */
  contextWindow?: number
}

export interface DetectedLanguage {
  language: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Enriched code context produced by the Analyst model.
 * Replaces hard-coded TypeScript if/else for language detection,
 * test-framework selection, diff detection, etc.
 */
export interface CodeContext {
  language: string
  confidence: 'high' | 'medium' | 'low'
  /** E.g. "Vitest", "pytest", "JUnit"; null if not applicable or unknown */
  testFramework: string | null
  /** True when the input looks like a git diff */
  isDiff: boolean
}

export interface SpecialistConfig {
  id: string
  displayName: string
  modelId: string
  buildSystemPrompt: (context: CodeContext, input: string) => string
}

export interface RoutingDecision {
  specialist: SpecialistConfig
  codeContext: CodeContext
  detectedLanguage: DetectedLanguage
  systemPrompt: string
  routingReason: string
}

export interface RoutingStep {
  step: 'detecting_language' | 'analyzing_task' | 'selecting_specialist' | 'generating_response'
  label: string
  detail?: string
  status: 'pending' | 'active' | 'done' | 'error'
}

export interface CostEstimate {
  inputTokens: number
  outputTokens: number
  specialistCostUsd: number
  largeModelCostUsd: number
  savingsPct: number
}
