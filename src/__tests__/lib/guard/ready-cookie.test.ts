import { parseReadyCookie } from '@/lib/guard/ready-cookie'

describe('parseReadyCookie', () => {
  it('returns null for undefined input', () => {
    expect(parseReadyCookie()).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    expect(parseReadyCookie('not-json')).toBeNull()
  })

  it('returns null for invalid payload shape', () => {
    const raw = encodeURIComponent(JSON.stringify({ key: 123, timestamp: 'now' }))
    expect(parseReadyCookie(raw)).toBeNull()
  })

  it('returns the parsed payload for a valid cookie', () => {
    const payload = { key: 'http://localhost:11434::qwen2.5:0.5b', timestamp: Date.now() }
    const raw = encodeURIComponent(JSON.stringify(payload))
    expect(parseReadyCookie(raw)).toEqual(payload)
  })
})
