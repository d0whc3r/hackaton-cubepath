import { redactionPlugin } from '@/lib/observability/redact'

function callPlugin(plugin: ReturnType<typeof redactionPlugin>, metadata: Record<string, unknown>) {
  return plugin.onMetadataCalled!(metadata)
}

describe('redactionPlugin', () => {
  describe('top-level field redaction', () => {
    it('censors a top-level field that exists', () => {
      const plugin = redactionPlugin({ censor: '[REDACTED]', paths: ['password'] })
      const result = callPlugin(plugin, { password: 'secret', user: 'alice' })
      expect(result).toEqual({ password: '[REDACTED]', user: 'alice' })
    })

    it('does not mutate the original metadata object', () => {
      const plugin = redactionPlugin({ censor: '[REDACTED]', paths: ['token'] })
      const original = { name: 'bob', token: 'abc123' }
      callPlugin(plugin, original)
      expect(original.token).toBe('abc123')
    })

    it('is a no-op for a field that does not exist', () => {
      const plugin = redactionPlugin({ censor: '[REDACTED]', paths: ['missing'] })
      const result = callPlugin(plugin, { name: 'alice' })
      expect(result).toEqual({ name: 'alice' })
    })
  })

  describe('nested field redaction', () => {
    it('censors a nested field via dot-path', () => {
      const plugin = redactionPlugin({ censor: '***', paths: ['user.password'] })
      const result = callPlugin(plugin, { user: { name: 'alice', password: 'secret' } })
      expect((result as Record<string, Record<string, unknown>>).user.password).toBe('***')
    })

    it('leaves sibling fields of the nested path intact', () => {
      const plugin = redactionPlugin({ censor: '***', paths: ['auth.token'] })
      const result = callPlugin(plugin, { auth: { token: 'abc', userId: 42 } }) as Record<
        string,
        Record<string, unknown>
      >
      expect(result.auth.userId).toBe(42)
    })

    it('handles deeply nested paths', () => {
      const plugin = redactionPlugin({ censor: 'X', paths: ['a.b.c'] })
      const result = callPlugin(plugin, { a: { b: { c: 'deep', d: 1 } } }) as Record<
        string,
        Record<string, Record<string, unknown>>
      >
      expect(result.a.b.c).toBe('X')
      expect(result.a.b.d).toBe(1)
    })

    it('is a no-op when the nested path does not exist', () => {
      const plugin = redactionPlugin({ censor: 'X', paths: ['a.b.missing'] })
      const result = callPlugin(plugin, { a: { b: { c: 'keep' } } })
      expect(result).toEqual({ a: { b: { c: 'keep' } } })
    })
  })

  describe('multiple paths', () => {
    it('censors multiple paths in one pass', () => {
      const plugin = redactionPlugin({ censor: '[R]', paths: ['apiKey', 'user.secret'] })
      const result = callPlugin(plugin, { apiKey: 'key', user: { id: 1, secret: 'shh' } }) as Record<string, unknown>
      expect(result.apiKey).toBe('[R]')
      expect((result.user as Record<string, unknown>).secret).toBe('[R]')
      expect((result.user as Record<string, unknown>).id).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('returns metadata unchanged when paths is empty', () => {
      const plugin = redactionPlugin({ censor: 'X', paths: [] })
      const result = callPlugin(plugin, { a: 1, b: 2 })
      expect(result).toEqual({ a: 1, b: 2 })
    })

    it('returns metadata as-is when null/undefined is passed', () => {
      const plugin = redactionPlugin({ censor: 'X', paths: ['a'] })
      // @ts-expect-error testing null input
      const result = plugin.onMetadataCalled!(null)
      expect(result).toBeNull()
    })

    it('ignores path traversal into non-object values', () => {
      const plugin = redactionPlugin({ censor: 'X', paths: ['a.b'] })
      // 'a' is a string, not an object — should not crash
      expect(() => callPlugin(plugin, { a: 'string-not-object' })).not.toThrow()
    })

    it('ignores path traversal into arrays', () => {
      const plugin = redactionPlugin({ censor: 'X', paths: ['a.b'] })
      expect(() => callPlugin(plugin, { a: [1, 2, 3] })).not.toThrow()
    })

    it('assigns the plugin id when provided', () => {
      const plugin = redactionPlugin({ censor: 'X', id: 'my-redactor', paths: [] })
      expect(plugin.id).toBe('my-redactor')
    })

    it('has no id when not provided', () => {
      const plugin = redactionPlugin({ censor: 'X', paths: [] })
      expect(plugin.id).toBeUndefined()
    })
  })
})
