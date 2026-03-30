import { renderHook, act } from '@testing-library/react'
import { useFileAttachment } from '@/hooks/use-file-attachment'

const MAX_CHARS = 15_000

let capturedOnload: (ev: ProgressEvent<FileReader>) => void = () => {}
function makeMockFileReader(content: string) {
  vi.stubGlobal(
    'FileReader',
    class {
      readAsText = vi.fn()
      get onload() {
        return capturedOnload
      }
      set onload(fn: ((ev: ProgressEvent<FileReader>) => void) | null) {
        capturedOnload = fn ?? (() => {})
      }
    },
  )

  return {
    triggerLoad: () => capturedOnload({ target: { result: content } } as unknown as ProgressEvent<FileReader>),
  }
}

describe('useFileAttachment', () => {
  it('starts with no attached file', () => {
    const onContent = vi.fn()
    const { result } = renderHook(() => useFileAttachment(onContent, MAX_CHARS))
    expect(result.current.attachedFileName).toBeNull()
  })

  it('removeFile clears filename and calls onContent with empty strings', () => {
    const onContent = vi.fn()
    const { result } = renderHook(() => useFileAttachment(onContent, MAX_CHARS))

    act(() => {
      result.current.removeFile()
    })

    expect(result.current.attachedFileName).toBeNull()
    expect(onContent).toHaveBeenCalledWith('', '')
  })

  it('onFileChange is a no-op when no file selected', () => {
    const onContent = vi.fn()
    const { result } = renderHook(() => useFileAttachment(onContent, MAX_CHARS))

    act(() => {
      result.current.onFileChange({
        target: { files: null, value: '' },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    })

    expect(onContent).not.toHaveBeenCalled()
  })

  it('onFileChange reads file content and calls onContent with sliced content', () => {
    const onContent = vi.fn()
    const { result } = renderHook(() => useFileAttachment(onContent, MAX_CHARS))

    const fileContent = 'const hello = "world"'
    const file = new File([fileContent], 'test.ts', { type: 'text/plain' })
    const { triggerLoad } = makeMockFileReader(fileContent)

    act(() => {
      result.current.onFileChange({
        target: { files: [file], value: 'test.ts' },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    })
    act(() => {
      triggerLoad()
    })

    expect(onContent).toHaveBeenCalledWith(fileContent.slice(0, MAX_CHARS), 'test.ts')
    expect(result.current.attachedFileName).toBe('test.ts')
  })

  it('onFileChange slices content to maxChars', () => {
    const maxChars = 10
    const onContent = vi.fn()
    const { result } = renderHook(() => useFileAttachment(onContent, maxChars))

    const longContent = 'a'.repeat(100)
    const file = new File([longContent], 'big.ts', { type: 'text/plain' })
    const { triggerLoad } = makeMockFileReader(longContent)

    act(() => {
      result.current.onFileChange({
        target: { files: [file], value: 'big.ts' },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    })
    act(() => {
      triggerLoad()
    })

    expect(onContent).toHaveBeenCalledWith('a'.repeat(maxChars), 'big.ts')
  })

  it('onFileChange resets input value after reading', () => {
    const onContent = vi.fn()
    const { result } = renderHook(() => useFileAttachment(onContent, MAX_CHARS))

    const file = new File(['content'], 'file.ts', { type: 'text/plain' })
    const mockTarget = { files: [file], value: 'file.ts' }
    makeMockFileReader('content')

    act(() => {
      result.current.onFileChange({ target: mockTarget } as unknown as React.ChangeEvent<HTMLInputElement>)
    })

    expect(mockTarget.value).toBe('')
  })
})
