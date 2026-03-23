import { validateInput } from '@/lib/railguard'

describe('prompt-flooding', () => {
  it('blocks a single word repeated ≥500 times', () => {
    // "foo " repeated 500 times = 2,000 chars, well under the 15k Zod cap
    const input = 'foo '.repeat(500).trim()
    const result = validateInput(input)
    expect(result.decision).toBe('blocked')
    expect(result.attackVectorCategory).toBe('prompt-flooding')
  })

  it('blocks input composed almost entirely of whitespace and newlines', () => {
    // 1000 newlines interspersed with a few chars (≤15k)
    const input = `${'\n'.repeat(500)}a${'\n'.repeat(499)}`
    const result = validateInput(input)
    expect(result.decision).toBe('blocked')
    expect(result.attackVectorCategory).toBe('prompt-flooding')
  })

  it('blocks a phrase repeated ≥100 times to pad context', () => {
    // "ignore this " × 200 = 2400 chars
    const input = 'ignore this '.repeat(200).trim()
    const result = validateInput(input)
    expect(result.decision).toBe('blocked')
    expect(result.attackVectorCategory).toBe('prompt-flooding')
  })

  it('does not block a normal long code review request', () => {
    const input =
      'Please review the following TypeScript code for correctness, readability, and adherence to best practices. ' +
      'function add(a: number, b: number): number { return a + b; } ' +
      'Also check for edge cases and suggest improvements.'
    const result = validateInput(input)
    expect(result.decision).toBe('allowed')
  })
})
