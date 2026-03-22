import { useRef, useState } from 'react'

export type OnFileContent = (content: string, fileName: string) => void

export interface UseFileAttachmentReturn {
  readonly attachedFileName: string | null
  readonly fileInputRef: React.RefObject<HTMLInputElement>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: () => void
}

export function useFileAttachment(onContent: OnFileContent, maxChars: number): UseFileAttachmentReturn {
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result
      if (typeof content === 'string') {
        onContent(content.slice(0, maxChars), file.name)
        setAttachedFileName(file.name)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function removeFile() {
    setAttachedFileName(null)
    onContent('', '')
  }

  return {
    attachedFileName,
    fileInputRef,
    onFileChange,
    removeFile,
  }
}
