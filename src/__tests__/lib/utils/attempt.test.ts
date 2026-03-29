import { attempt } from '@/lib/utils/attempt'

describe('attempt; sync', () => {
  it('returns { ok: true, value } on success', () => {
    const result = attempt(() => 42)
    expect(result).toEqual({ ok: true, value: 42 })
  })

  it('returns { ok: false, error } on throw (no fallback)', () => {
    const err = new Error('boom')
    const result = attempt(() => {
      throw err
    })
    expect(result).toEqual({ error: err, ok: false })
  })

  it('returns { ok: true, value: fallback } on throw with plain-value fallback', () => {
    const result = attempt(() => {
      throw new Error('fail')
    }, 99)
    expect(result).toEqual({ ok: true, value: 99 })
  })

  it('returns { ok: true, value } on throw with function fallback that succeeds', () => {
    const result = attempt(
      () => {
        throw new Error('fail')
      },
      () => 'recovered',
    )
    expect(result).toEqual({ ok: true, value: 'recovered' })
  })

  it('returns { ok: false, error: originalError } when function fallback also throws', () => {
    const original = new Error('original')
    const result = attempt(
      () => {
        throw original
      },
      () => {
        throw new Error('fallback also failed')
      },
    )
    expect(result).toEqual({ error: original, ok: false })
  })

  it('never throws itself', () => {
    expect(() =>
      attempt(() => {
        throw new Error('anything')
      }),
    ).not.toThrow()
  })
})

describe('attempt; async', () => {
  it('returns Promise<{ ok: true, value }> on resolution', async () => {
    const result = attempt(() => Promise.resolve('hello'))
    expect(result).resolves.toEqual({ ok: true, value: 'hello' })
  })

  it('returns Promise<{ ok: false, error }> on rejection (no fallback)', async () => {
    const err = new Error('async boom')
    const result = attempt(() => Promise.reject<string>(err))
    expect(result).resolves.toEqual({ error: err, ok: false })
  })

  it('returns { ok: true, value: fallback } on rejection with plain-value fallback', async () => {
    const result = attempt(() => Promise.reject<number>(new Error('fail')), 0)
    expect(result).resolves.toEqual({ ok: true, value: 0 })
  })

  it('returns { ok: true, value } on rejection with async function fallback that resolves', async () => {
    const result = attempt(
      () => Promise.reject<string>(new Error('fail')),
      async () => 'async-recovered',
    )
    expect(result).resolves.toEqual({ ok: true, value: 'async-recovered' })
  })

  it('returns { ok: false, error: originalError } when async fallback also rejects', async () => {
    const original = new Error('original async')
    const result = attempt(
      () => Promise.reject<string>(original),
      async () => {
        throw new Error('fallback rejected')
      },
    )
    expect(result).resolves.toEqual({ error: original, ok: false })
  })

  it('never returns a rejected Promise', async () => {
    await expect(attempt(() => Promise.reject(new Error('x')))).resolves.toBeDefined()
  })
})
