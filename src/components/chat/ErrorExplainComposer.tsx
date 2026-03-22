import { Send, Square } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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

  function handleKeyDown(event: React.KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-border/60 bg-background/95 p-3 backdrop-blur-sm md:p-4">
      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="error-msg" className="text-xs font-medium text-foreground">
          Error message <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="error-msg"
          value={errorMsg}
          onChange={(event) => setErrorMsg(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste the error message or stack trace…"
          className={[
            'max-h-40 resize-none overflow-y-auto font-mono text-xs leading-relaxed',
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
        <Textarea
          id="code-snippet"
          value={codeSnippet}
          onChange={(event) => setCodeSnippet(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste the relevant code snippet for more context…"
          className="max-h-32 resize-none overflow-y-auto font-mono text-xs leading-relaxed"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end">
        {isLoading ? (
          <Button type="button" variant="outline" size="sm" onClick={handleCancel} className="h-8 gap-1.5">
            <Square className="h-3 w-3 fill-current" />
            Stop
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={submit} className="h-8 gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Send
            <kbd className="hidden rounded border border-primary-foreground/30 px-1 py-0.5 font-mono text-[9px] opacity-70 sm:inline">
              ⌘↵
            </kbd>
          </Button>
        )}
      </div>
    </div>
  )
}
