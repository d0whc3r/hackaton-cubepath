/** The recognised adversarial technique categories. */
export type AttackVectorCategory =
  | 'role-play-override'
  | 'instruction-injection'
  | 'encoding-bypass'
  | 'persona-switch'
  | 'prompt-flooding'
  | 'semantic-check' // Input passed static rules but the AI guard determined it is not a legitimate task request

/** A single rule definition in the railguard registry. */
export interface RailguardRule {
  id: string
  name: string
  category: AttackVectorCategory
  status: 'active' | 'inactive'
  patterns: RegExp[]
  description: string
  version: number
}

/** The immediate return value of validateInput(). Not persisted. */
export interface ValidationResult {
  decision: 'blocked' | 'allowed'
  matchedRuleId: string | null
  attackVectorCategory: AttackVectorCategory | null
  blockReason: string | null
}

/** A persisted record of a single input evaluation. Retained for 30 days. */
export interface ValidationEvent {
  id: string
  timestamp: Date
  decision: 'blocked' | 'allowed'
  matchedRuleId: string | null
  attackVectorCategory: AttackVectorCategory | null
  sanitisedExcerpt: string
  blockReason: string | null
}

/** Aggregated statistics computed on-demand for a given time window. */
export interface SecurityMetrics {
  windowStart: Date
  windowEnd: Date
  totalEvaluations: number
  blockedCount: number
  allowedCount: number
  blockRate: number | null
  byCategory: Record<AttackVectorCategory, number>
}
