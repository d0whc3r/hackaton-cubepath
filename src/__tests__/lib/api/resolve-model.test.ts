import { resolveModel } from '@/lib/api/resolve-model'

describe('resolveModel', () => {
  it('returns trimmed fromBody when non-empty', () => {
    expect(resolveModel('  my-model  ', 'env-model', 'fallback')).toBe('my-model')
  })

  it('skips fromBody and returns trimmed envVar when body is empty string', () => {
    expect(resolveModel('', 'env-model', 'fallback')).toBe('env-model')
  })

  it('skips fromBody and returns trimmed envVar when body is whitespace-only', () => {
    expect(resolveModel('   ', 'env-model', 'fallback')).toBe('env-model')
  })

  it('skips fromBody and returns trimmed envVar when body is undefined', () => {
    expect(resolveModel(undefined, 'env-model', 'fallback')).toBe('env-model')
  })

  it('returns fallback when both fromBody and envVar are empty', () => {
    expect(resolveModel('', '', 'fallback')).toBe('fallback')
  })

  it('returns fallback when both fromBody and envVar are undefined', () => {
    expect(resolveModel(undefined, undefined, 'fallback')).toBe('fallback')
  })

  it('returns fallback when both are whitespace-only', () => {
    expect(resolveModel('   ', '   ', 'fallback')).toBe('fallback')
  })

  it('trims envVar before returning it', () => {
    expect(resolveModel(undefined, '  trimmed  ', 'fallback')).toBe('trimmed')
  })
})
