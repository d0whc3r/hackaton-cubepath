import { useRef, useState } from 'react'

type OnFileContent = (content: string, fileName: string) => void

interface UseFileAttachmentReturn {
  attachedFileName: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
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
    // oxlint-disable-next-line unicorn/prefer-add-event-listener
    reader.onload = (ev) => {
      const content = ev.target?.result
      if (typeof content === 'string') {
        onContent(content.slice(0, maxChars), file.name)
        setAttachedFileName(file.name)
      }
    }
    // oxlint-disable-next-line unicorn/prefer-blob-reading-methods
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
