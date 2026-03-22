import { useRef, useState } from 'react'

export type OnFileContent = (content: string, fileName: string) => void

export interface UseFileAttachmentReturn {
  attachedFileName: string | null
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: () => void
}

export function useFileAttachment(onContent: OnFileContent, maxChars: number): UseFileAttachmentReturn {
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.addEventListener('load', (ev) => {
      const content = ev.target?.result
      if (typeof content === 'string') {
        onContent(content.slice(0, maxChars), file.name)
        setAttachedFileName(file.name)
      }
    })
    reader.readAsText(file)
    event.target.value = ''
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
