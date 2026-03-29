import { resolveValue } from '@/lib/api/resolve-model'

describe('resolveValue', () => {
  it('returns trimmed fromBody when non-empty', () => {
    expect(resolveValue('  my-model  ', 'env-model', 'fallback')).toBe('my-model')
  })

  it('skips fromBody and returns trimmed envVar when body is empty string', () => {
    expect(resolveValue('', 'env-model', 'fallback')).toBe('env-model')
  })

  it('skips fromBody and returns trimmed envVar when body is whitespace-only', () => {
    expect(resolveValue('   ', 'env-model', 'fallback')).toBe('env-model')
  })

  it('skips fromBody and returns trimmed envVar when body is undefined', () => {
    expect(resolveValue(undefined, 'env-model', 'fallback')).toBe('env-model')
  })

  it('returns fallback when both fromBody and envVar are empty', () => {
    expect(resolveValue('', '', 'fallback')).toBe('fallback')
  })

  it('returns fallback when both fromBody and envVar are undefined', () => {
    expect(resolveValue(undefined, undefined, 'fallback')).toBe('fallback')
  })

  it('returns fallback when both are whitespace-only', () => {
    expect(resolveValue('   ', '   ', 'fallback')).toBe('fallback')
  })

  it('trims envVar before returning it', () => {
    expect(resolveValue(undefined, '  trimmed  ', 'fallback')).toBe('trimmed')
  })
})
