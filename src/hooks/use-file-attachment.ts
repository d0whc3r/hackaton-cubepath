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
    void file.text().then((content) => {
      onContent(content.slice(0, maxChars), file.name)
      setAttachedFileName(file.name)
    })
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
