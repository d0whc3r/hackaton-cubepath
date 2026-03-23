/** The recognised adversarial technique categories. */
export type AttackVectorCategory = 'semantic-check'

/** The immediate return value of validateInputSemantic(). Not persisted. */
export interface ValidationResult {
  attackVectorCategory: AttackVectorCategory | null
  blockReason: string | null
  decision: 'allowed' | 'blocked'
  matchedRuleId: string | null
}

/** A persisted record of a single input evaluation. Retained for 30 days. */
export interface ValidationEvent {
  attackVectorCategory: AttackVectorCategory | null
  blockReason: string | null
  decision: 'allowed' | 'blocked'
  id: string
  matchedRuleId: string | null
  sanitisedExcerpt: string
  timestamp: Date
}

/** Aggregated statistics computed on-demand for a given time window. */
export interface SecurityMetrics {
  allowedCount: number
  blockRate: number | null
  blockedCount: number
  byCategory: Record<AttackVectorCategory, number>
  totalEvaluations: number
  windowEnd: Date
  windowStart: Date
}
