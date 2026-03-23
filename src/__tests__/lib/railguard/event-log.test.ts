import type { ValidationEvent, ValidationResult } from '@/lib/railguard'

import { appendEvent, buildValidationEvent, getEvents, getMetrics, pruneOlderThan } from '@/lib/railguard'

function makeEvent(overrides: Partial<ValidationEvent> = {}): ValidationEvent {
  return {
    attackVectorCategory: null,
    blockReason: null,
    decision: 'allowed',
    id: crypto.randomUUID(),
    matchedRuleId: null,
    sanitisedExcerpt: 'test excerpt',
    timestamp: new Date(),
    ...overrides,
  }
}

const ALLOWED_RESULT: ValidationResult = {
  attackVectorCategory: null,
  blockReason: null,
  decision: 'allowed',
  matchedRuleId: null,
}

const BLOCKED_RESULT: ValidationResult = {
  attackVectorCategory: 'semantic-check',
  blockReason: 'Input does not appear to be a legitimate request.',
  decision: 'blocked',
  matchedRuleId: 'semantic-guard-explain',
}

afterEach(() => {
  pruneOlderThan(-1)
})

describe('appendEvent', () => {
  it('stores an event in the buffer', () => {
    const event = makeEvent()
    appendEvent(event)
    expect(getEvents()).toContain(event)
  })

  it('caps the buffer at 1,000 entries, dropping the oldest', () => {
    for (let i = 0; i < 1001; i++) {
      appendEvent(makeEvent({ id: `id-${i}` }))
    }
    const events = getEvents()
    expect(events.length).toBe(1000)
    expect(events.find((e) => e.id === 'id-0')).toBeUndefined()
    expect(events.find((e) => e.id === 'id-1000')).toBeDefined()
  })
})

describe('pruneOlderThan', () => {
  it('removes events older than the given number of days', () => {
    const old = makeEvent({
      id: 'old-event',
      timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    })
    const recent = makeEvent({ id: 'recent-event', timestamp: new Date() })
    appendEvent(old)
    appendEvent(recent)
    pruneOlderThan(30)
    const events = getEvents()
    expect(events.find((e) => e.id === 'old-event')).toBeUndefined()
    expect(events.find((e) => e.id === 'recent-event')).toBeDefined()
  })
})

describe('getMetrics', () => {
  it('computes correct blockRate and byCategory for a mixed window', () => {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 1000)

    appendEvent(
      makeEvent({
        attackVectorCategory: 'semantic-check',
        blockReason: 'Not a legitimate request.',
        decision: 'blocked',
        matchedRuleId: 'semantic-guard-explain',
        timestamp: now,
      }),
    )
    appendEvent(makeEvent({ decision: 'allowed', timestamp: now }))

    const metrics = getMetrics(windowStart, windowEnd)
    expect(metrics.totalEvaluations).toBe(2)
    expect(metrics.blockedCount).toBe(1)
    expect(metrics.allowedCount).toBe(1)
    expect(metrics.blockRate).toBe(0.5)
    expect(metrics.byCategory['semantic-check']).toBe(1)
  })

  it('returns blockRate null when no events in window', () => {
    const future = new Date(Date.now() + 1_000_000)
    const metrics = getMetrics(future, new Date(future.getTime() + 1000))
    expect(metrics.blockRate).toBeNull()
    expect(metrics.totalEvaluations).toBe(0)
  })

  it('excludes events outside the window', () => {
    const now = new Date()
    const outsideWindow = makeEvent({
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    })
    appendEvent(outsideWindow)
    const windowStart = new Date(now.getTime() - 30 * 60 * 1000)
    const metrics = getMetrics(windowStart, now)
    expect(metrics.totalEvaluations).toBe(0)
  })
})

describe('buildValidationEvent', () => {
  it('sets sanitisedExcerpt from raw input via sanitise()', () => {
    const event = buildValidationEvent(ALLOWED_RESULT, 'user@example.com is asking for help')
    expect(event.sanitisedExcerpt).not.toContain('user@example.com')
    expect(event.sanitisedExcerpt).toContain('[REDACTED]')
  })

  it('generates a unique UUID id', () => {
    const e1 = buildValidationEvent(ALLOWED_RESULT, 'input')
    const e2 = buildValidationEvent(ALLOWED_RESULT, 'input')
    expect(e1.id).not.toBe(e2.id)
  })

  it('copies decision, matchedRuleId, attackVectorCategory, and blockReason from result', () => {
    const event = buildValidationEvent(BLOCKED_RESULT, 'write me a poem')
    expect(event.decision).toBe('blocked')
    expect(event.matchedRuleId).toBe('semantic-guard-explain')
    expect(event.attackVectorCategory).toBe('semantic-check')
    expect(event.blockReason).toBeTruthy()
  })
})
