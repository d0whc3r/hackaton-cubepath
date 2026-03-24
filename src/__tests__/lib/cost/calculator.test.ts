import { estimateCost } from '@/lib/cost/calculator'

describe('estimateCost', () => {
  it('calculates tokens as ceil(chars / 4)', () => {
    const result = estimateCost(400, 200)
    expect(result.inputTokens).toBe(100)
    expect(result.outputTokens).toBe(50)
  })

  it('rounds up for non-divisible char counts', () => {
    const result = estimateCost(401, 201)
    expect(result.inputTokens).toBe(101)
    expect(result.outputTokens).toBe(51)
  })

  it('calculates specialist cost at $0.000001/token', () => {
    const result = estimateCost(400, 400) // 100+100 = 200 tokens
    expect(result.specialistCostUsd).toBeCloseTo(0.0002, 7)
  })

  it('calculates large model cost at $0.000015/token', () => {
    const result = estimateCost(400, 400) // 100+100 = 200 tokens
    expect(result.largeModelCostUsd).toBeCloseTo(0.003, 7)
  })

  it('calculates savings percentage approximately 93%', () => {
    const result = estimateCost(1000, 1000)
    expect(result.savingsPct).toBe(93)
  })

  it('handles 0-token edge case without division errors', () => {
    const result = estimateCost(0, 0)
    expect(result.inputTokens).toBe(0)
    expect(result.outputTokens).toBe(0)
    expect(result.specialistCostUsd).toBe(0)
    expect(result.largeModelCostUsd).toBe(0)
    expect(result.savingsPct).toBe(0)
  })

  it('savingsPct is a whole number', () => {
    const result = estimateCost(500, 500)
    expect(Number.isInteger(result.savingsPct)).toBe(true)
  })

  it('savingsPct is between 0 and 100', () => {
    const result = estimateCost(100, 100)
    expect(result.savingsPct).toBeGreaterThanOrEqual(0)
    expect(result.savingsPct).toBeLessThanOrEqual(100)
  })
})
