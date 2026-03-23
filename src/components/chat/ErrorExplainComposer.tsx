import { useState } from 'react'

import { ComposerSubmitControls } from '@/components/chat/ComposerSubmitControls'
import { ComposerTextarea } from '@/components/chat/ComposerTextarea'
import { useSubmitShortcut } from '@/hooks/use-submit-shortcut'
import { useChatContext } from '@/lib/context/chat-context'

export function ErrorExplainComposer() {
  const { isLoading, handleSubmit, handleCancel } = useChatContext()
  const [errorMsg, setErrorMsg] = useState('')
  const [codeSnippet, setCodeSnippet] = useState('')
  const [touched, setTouched] = useState(false)

  const isErrorEmpty = errorMsg.trim() === ''

  function submit() {
    if (isErrorEmpty) {
      setTouched(true)
      return
    }

    const parts = [`ERROR:\n${errorMsg.trim()}`]
    if (codeSnippet.trim()) {
      parts.push(`CODE:\n${codeSnippet.trim()}`)
    }
    const combined = parts.join('\n\n')

    handleSubmit(combined, 'error-explain')
    setErrorMsg('')
    setCodeSnippet('')
    setTouched(false)
  }

  const handleKeyDown = useSubmitShortcut(submit)

  return (
    <div className="border-t border-border/60 bg-background/95 p-3 backdrop-blur-sm md:p-4">
      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="error-msg" className="text-xs font-medium text-foreground">
          Error message <span className="text-destructive">*</span>
        </label>
        <ComposerTextarea
          id="error-msg"
          value={errorMsg}
          onChange={(event) => setErrorMsg(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste the error message or stack trace…"
          className={[
            'max-h-40',
            touched && isErrorEmpty ? 'border-destructive focus-visible:ring-destructive' : '',
          ].join(' ')}
          disabled={isLoading}
        />
        {touched && isErrorEmpty && <p className="text-xs text-destructive">Error message is required.</p>}
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="code-snippet" className="text-xs font-medium text-muted-foreground">
          Code snippet <span className="text-muted-foreground/60">(optional)</span>
        </label>
        <ComposerTextarea
          id="code-snippet"
          value={codeSnippet}
          onChange={(event) => setCodeSnippet(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste the relevant code snippet for more context…"
          className="max-h-32"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end">
        <ComposerSubmitControls isLoading={isLoading} onCancel={handleCancel} onSubmit={submit} />
      </div>
    </div>
  )
}
