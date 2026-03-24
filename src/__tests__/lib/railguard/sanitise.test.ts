import { sanitise } from '@/lib/railguard'

describe('sanitise', () => {
  it('truncates input to 100 characters', () => {
    const input = 'a'.repeat(200)
    const result = sanitise(input)
    expect(result.length).toBe(100)
  })

  it('redacts a single email address', () => {
    const result = sanitise('contact user@example.com for details')
    expect(result).not.toContain('user@example.com')
    expect(result).toContain('[REDACTED]')
  })

  it('redacts multiple email addresses', () => {
    const result = sanitise('from: a@b.com to: c@d.org')
    expect(result).not.toContain('a@b.com')
    expect(result).not.toContain('c@d.org')
  })

  it('redacts an E.164 phone number', () => {
    const result = sanitise('call me at +15551234567 anytime')
    expect(result).not.toContain('+15551234567')
    expect(result).toContain('[REDACTED]')
  })

  it('does not throw on empty string input', () => {
    expect(() => sanitise('')).not.toThrow()
    expect(sanitise('')).toBe('')
  })

  it('does not throw on 15,000-character input', () => {
    const longInput = 'x'.repeat(15_000)
    expect(() => sanitise(longInput)).not.toThrow()
    expect(sanitise(longInput).length).toBe(100)
  })

  it('does not redact when no PII is present', () => {
    const clean = 'how do I write a unit test for a React component?'
    expect(sanitise(clean)).toBe(clean)
  })

  it('truncates before redacting (PII beyond char 100 is not present in output)', () => {
    // Email starts at position 105; beyond the truncation boundary
    const prefix = 'a'.repeat(105)
    const result = sanitise(`${prefix}user@example.com`)
    // The email should not appear (truncated) and no [REDACTED] for out-of-range PII
    expect(result).not.toContain('[REDACTED]')
    expect(result.length).toBe(100)
  })
})
