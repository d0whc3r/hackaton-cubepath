import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ComposerSubmitControls } from '@/components/chat/ComposerSubmitControls'
import { ComposerTextarea } from '@/components/chat/ComposerTextarea'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MAX_CHARS } from '@/hooks/use-chat-input'
import { useSubmitShortcut } from '@/hooks/use-submit-shortcut'
import { useChatContext } from '@/lib/context/chat-context'
import { MODELS_BY_TASK } from '@/lib/router/models'

function parsePreviousErrorExplainInput(content: string): { errorMsg: string; codeSnippet: string } {
  const parsed = content.match(/^ERROR:\n([\s\S]*?)(?:\n\nCODE:\n([\s\S]*))?$/)
  if (!parsed) {
    return { codeSnippet: '', errorMsg: content }
  }

  return {
    codeSnippet: parsed[2] ?? '',
    errorMsg: parsed[1] ?? '',
  }
}

export function ErrorExplainComposer() {
  const { isLoading, handleSubmit, handleCancel, handleClearHistory, entries, currentModel } = useChatContext()
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

  const submitShortcut = useSubmitShortcut(submit)

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === 'ArrowUp' &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.shiftKey &&
      !errorMsg.trim() &&
      !codeSnippet.trim()
    ) {
      const previousInput = entries.at(-1)?.userMessage.content
      if (previousInput) {
        const previous = parsePreviousErrorExplainInput(previousInput)
        event.preventDefault()
        setErrorMsg(previous.errorMsg)
        setCodeSnippet(previous.codeSnippet)
        setTouched(false)
        return
      }
    }

    submitShortcut(event)
  }

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

      <div className="mt-2 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          <Badge variant="outline" className="hidden shrink-0 gap-1 font-mono text-[10px] sm:flex">
            <span className="text-muted-foreground">model</span>
            <span>{MODELS_BY_TASK['error-explain'].find((m) => m.id === currentModel)?.label ?? currentModel}</span>
          </Badge>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {(errorMsg.length + codeSnippet.length).toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
          {entries.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="ml-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground/60 transition-colors hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Clear conversation history</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ComposerSubmitControls isLoading={isLoading} onCancel={handleCancel} onSubmit={submit} />
        </div>
      </div>
    </div>
  )
}
