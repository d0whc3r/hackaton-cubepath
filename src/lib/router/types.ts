export type TaskType = 'explain' | 'test' | 'refactor' | 'commit'

export interface ModelOption {
  readonly id: string
  readonly label: string
  readonly params: string
  readonly size: string
  readonly description: string
  /** Context window in tokens (e.g. 8192, 32768, 131072) */
  readonly contextWindow?: number
  /**
   * Translation section only — true if the model can reliably translate
   * code blocks (not just prose). When false/absent, code blocks are always
   * extracted client-side before sending to the model.
   */
  readonly canTranslateCode?: boolean
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
  /** E.g. "Vitest", "pytest", "JUnit" — null if not applicable or unknown */
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
