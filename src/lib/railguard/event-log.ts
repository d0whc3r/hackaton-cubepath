import { logServer } from '@/lib/observability/server'
import type { AttackVectorCategory, SecurityMetrics, ValidationEvent, ValidationResult } from './types'
import { sanitise } from './sanitise'

const MAX_BUFFER = 1000
const RETENTION_DAYS = 30
const PRUNE_INTERVAL_MS = 60_000

/**
 * Module-level in-memory circular buffer used for local inspection and tests.
 * Durable retention comes from structured server logs emitted in appendEvent().
 */
const eventBuffer: ValidationEvent[] = []
let lastPruneAt = 0

/**
 * Removes all ValidationEvents older than the specified number of days.
 * Called automatically by appendEvent() before each append (enforces 30-day retention).
 */
export function pruneOlderThan(days: number): void {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  let i = 0
  while (i < eventBuffer.length) {
    const event = eventBuffer[i]
    if (!event || event.timestamp >= cutoff) {
      break
    }
    i++
  }
  if (i > 0) {
    eventBuffer.splice(0, i)
  }
}

/**
 * Appends a ValidationEvent to the in-memory event log.
 * - Prunes events older than 30 days at most once per minute (not on every call).
 * - Caps the buffer at 1,000 entries, dropping the oldest on overflow.
 * - Never throws.
 */
export function appendEvent(event: ValidationEvent): void {
  try {
    logServer(event.decision === 'blocked' ? 'warn' : 'info', 'security.event', {
      attackVectorCategory: event.attackVectorCategory ?? 'none',
      blockReason: event.blockReason,
      decision: event.decision,
      eventId: event.id,
      matchedRuleId: event.matchedRuleId ?? 'none',
      sanitisedExcerpt: event.sanitisedExcerpt,
      timestamp: event.timestamp.toISOString(),
    })

    const now = Date.now()
    if (now - lastPruneAt > PRUNE_INTERVAL_MS) {
      pruneOlderThan(RETENTION_DAYS)
      lastPruneAt = now
    }
    eventBuffer.push(event)
    if (eventBuffer.length > MAX_BUFFER) {
      eventBuffer.splice(0, eventBuffer.length - MAX_BUFFER)
    }
  } catch {
    // Intentionally swallowed; logging must never crash the request
  }
}

/**
 * Returns the current event buffer as a read-only array.
 * Intended for test inspection only.
 */
export function getEvents(): ValidationEvent[] {
  return eventBuffer
}

/**
 * Returns aggregated SecurityMetrics for the given time window.
 * - Includes only events where timestamp >= windowStart AND timestamp <= windowEnd.
 * - Returns blockRate: null when totalEvaluations === 0.
 * - Never throws.
 */
export function getMetrics(windowStart: Date, windowEnd: Date): SecurityMetrics {
  const zeroByCategory: Record<AttackVectorCategory, number> = {
    'semantic-check': 0,
  }

  const windowEvents = eventBuffer.filter((event) => event.timestamp >= windowStart && event.timestamp <= windowEnd)

  const blockedCount = windowEvents.filter((event) => event.decision === 'blocked').length
  const allowedCount = windowEvents.filter((event) => event.decision === 'allowed').length
  const totalEvaluations = windowEvents.length

  const byCategory = windowEvents
    .filter((event) => event.decision === 'blocked' && event.attackVectorCategory !== null)
    .reduce(
      (acc, event) => {
        const cat = event.attackVectorCategory as AttackVectorCategory
        acc[cat] = (acc[cat] ?? 0) + 1
        return acc
      },
      { ...zeroByCategory },
    )

  return {
    allowedCount,
    blockRate: totalEvaluations === 0 ? null : blockedCount / totalEvaluations,
    blockedCount,
    byCategory,
    totalEvaluations,
    windowEnd,
    windowStart,
  }
}

/**
 * Constructs a ValidationEvent from a ValidationResult and the original raw input.
 * - Uses sanitise() to produce the sanitisedExcerpt.
 * - Generates a UUID v4 via crypto.randomUUID().
 * - Sets timestamp to the current UTC time.
 */
export function buildValidationEvent(result: ValidationResult, rawInput: string): ValidationEvent {
  return {
    attackVectorCategory: result.attackVectorCategory,
    blockReason: result.blockReason,
    decision: result.decision,
    id: crypto.randomUUID(),
    matchedRuleId: result.matchedRuleId,
    sanitisedExcerpt: sanitise(rawInput),
    timestamp: new Date(),
  }
}
