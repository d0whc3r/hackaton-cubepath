import { formatUsd, formatTime } from '@/lib/utils/format'

describe('formatUsd', () => {
  it('returns "$0.00" for exactly zero', () => {
    expect(formatUsd(0)).toBe('$0.00')
  })

  it('returns exponential notation for values smaller than 0.000001', () => {
    const result = formatUsd(0.000_000_9)
    expect(result).toMatch(/^\$9\.00e-7$/)
  })

  it('returns exponential notation for the boundary value just below 0.000001', () => {
    const result = formatUsd(0.000_000_1)
    expect(result).toMatch(/^\$/)
    expect(result).toContain('e-')
  })

  it('returns 7-decimal fixed notation for values >= 0.000001', () => {
    expect(formatUsd(0.000_001)).toBe('$0.0000010')
  })

  it('returns 7-decimal fixed notation for normal values', () => {
    expect(formatUsd(1.5)).toBe('$1.5000000')
  })

  it('returns 7-decimal fixed notation for values slightly above threshold', () => {
    expect(formatUsd(0.000_001_5)).toBe('$0.0000015')
  })

  it('handles large values', () => {
    expect(formatUsd(100)).toBe('$100.0000000')
  })
})

describe('formatTime', () => {
  it('returns a HH:MM string from a Date', () => {
    const date = new Date(2024, 0, 1, 14, 5)
    const result = formatTime(date)
    // Should contain digits and a colon — locale-specific but always HH:MM format
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })

  it('formats midnight as 00:00 or 12:00 AM depending on locale', () => {
    const date = new Date(2024, 0, 1, 0, 0)
    const result = formatTime(date)
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })

  it('formats noon correctly', () => {
    const date = new Date(2024, 0, 1, 12, 30)
    const result = formatTime(date)
    expect(result).toMatch(/\d{1,2}:30/)
  })
})
