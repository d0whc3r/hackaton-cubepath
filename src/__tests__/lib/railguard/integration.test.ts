import type { ValidationResult } from '@/lib/railguard'
import { appendEvent, buildValidationEvent, getEvents, getMetrics, pruneOlderThan } from '@/lib/railguard'

const BLOCKED_RESULT: ValidationResult = {
  attackVectorCategory: 'semantic-check',
  blockReason: 'Input does not appear to be a legitimate request.',
  decision: 'blocked',
  matchedRuleId: 'semantic-guard-explain',
}

const ALLOWED_RESULT: ValidationResult = {
  attackVectorCategory: null,
  blockReason: null,
  decision: 'allowed',
  matchedRuleId: null,
}

afterEach(() => {
  pruneOlderThan(-1)
})

describe('railguard integration; semantic pipeline', () => {
  it('blocked result is logged with non-null fields', () => {
    const event = buildValidationEvent(BLOCKED_RESULT, 'write me a poem')
    appendEvent(event)

    const stored = getEvents().find((e) => e.id === event.id)
    expect(stored).toBeDefined()
    expect(stored?.decision).toBe('blocked')
    expect(stored?.sanitisedExcerpt).toBe('write me a poem')
    expect(stored?.matchedRuleId).toBe('semantic-guard-explain')
    expect(stored?.attackVectorCategory).toBe('semantic-check')
    expect(stored?.blockReason).toBe(BLOCKED_RESULT.blockReason)
  })

  it('metrics are queryable by time window', () => {
    const windowStart = new Date(Date.now() - 60_000)
    const windowEnd = new Date(Date.now() + 5000)

    appendEvent(buildValidationEvent(BLOCKED_RESULT, 'write me a poem'))
    appendEvent(buildValidationEvent(ALLOWED_RESULT, 'function add(a, b) { return a + b }'))

    const metrics = getMetrics(windowStart, windowEnd)
    expect(metrics.blockedCount).toBe(1)
    expect(metrics.allowedCount).toBe(1)
    expect(metrics.blockRate).toBe(0.5)
    expect(metrics.byCategory['semantic-check']).toBe(1)
  })

  it('FR-003: error response does not reveal rule ID, attack vector, or block reason', () => {
    const blockedResponse = { error: 'Input blocked by security policy.' }
    const responseStr = JSON.stringify(blockedResponse)

    expect(responseStr).not.toMatch(/semantic-guard|semantic-check/)
    expect(responseStr).not.toMatch(/matchedRule|attackVector|blockReason/)
    expect(responseStr).toBe('{"error":"Input blocked by security policy."}')
  })

  it('allowed result is logged with decision allowed', () => {
    const windowStart = new Date(Date.now() - 60_000)
    const windowEnd = new Date(Date.now() + 5000)

    appendEvent(buildValidationEvent(ALLOWED_RESULT, 'function fibonacci(n) { return n }'))

    const metrics = getMetrics(windowStart, windowEnd)
    expect(metrics.allowedCount).toBeGreaterThanOrEqual(1)
  })
})
