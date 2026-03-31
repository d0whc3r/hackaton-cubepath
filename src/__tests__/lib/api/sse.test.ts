import { createChunkBuffer } from '@/lib/api/sse'

describe('createChunkBuffer', () => {
  it('flushes immediately when chunk contains a newline', () => {
    const flush = vi.fn()
    const buf = createChunkBuffer(flush)

    buf.add('hello\n')

    expect(flush).toHaveBeenCalledTimes(1)
    expect(flush).toHaveBeenCalledWith('hello\n')
  })

  it('flushes when buffer reaches MIN_FLUSH_CHARS (5) without a newline', () => {
    const flush = vi.fn()
    const buf = createChunkBuffer(flush)

    buf.add('12345')

    expect(flush).toHaveBeenCalledTimes(1)
    expect(flush).toHaveBeenCalledWith('12345')
  })

  it('accumulates small chunks below threshold and flushes when limit reached', () => {
    const flush = vi.fn()
    const buf = createChunkBuffer(flush)

    buf.add('ab')
    expect(flush).not.toHaveBeenCalled()

    buf.add('cd')
    expect(flush).not.toHaveBeenCalled()

    buf.add('e')
    expect(flush).toHaveBeenCalledTimes(1)
    expect(flush).toHaveBeenCalledWith('abcde')
  })

  it('resets buffer after flush so next chars start fresh', () => {
    const flush = vi.fn()
    const buf = createChunkBuffer(flush)

    buf.add('12345') // Flush
    buf.add('ab') // No flush yet

    expect(flush).toHaveBeenCalledTimes(1)
    expect(flush).toHaveBeenCalledWith('12345')
  })

  it('end() flushes remaining buffered content', () => {
    const flush = vi.fn()
    const buf = createChunkBuffer(flush)

    buf.add('hi')
    expect(flush).not.toHaveBeenCalled()

    buf.end()

    expect(flush).toHaveBeenCalledTimes(1)
    expect(flush).toHaveBeenCalledWith('hi')
  })

  it('end() is a no-op when buffer is empty', () => {
    const flush = vi.fn()
    const buf = createChunkBuffer(flush)

    buf.end()

    expect(flush).not.toHaveBeenCalled()
  })

  it('end() resets buffer so subsequent end() does nothing', () => {
    const flush = vi.fn()
    const buf = createChunkBuffer(flush)

    buf.add('x')
    buf.end()
    buf.end()

    expect(flush).toHaveBeenCalledTimes(1)
  })

  it('newline in middle of long chunk still flushes on newline condition', () => {
    const flush = vi.fn()
    const buf = createChunkBuffer(flush)

    buf.add('a\nb')

    expect(flush).toHaveBeenCalledTimes(1)
    expect(flush).toHaveBeenCalledWith('a\nb')
  })

  it('flushes when chunk alone meets the 5-char threshold exactly', () => {
    const flush = vi.fn()
    const buf = createChunkBuffer(flush)

    buf.add('abcde')

    expect(flush).toHaveBeenCalledTimes(1)
  })

  it('does not flush for 4 chars (below threshold, no newline)', () => {
    const flush = vi.fn()
    const buf = createChunkBuffer(flush)

    buf.add('abcd')

    expect(flush).not.toHaveBeenCalled()
  })
})
