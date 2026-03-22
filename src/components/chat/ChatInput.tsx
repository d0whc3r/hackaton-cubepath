import { Paperclip, Send, Square, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import type { TaskType } from '@/lib/schemas/route'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MAX_CHARS, useChatInput } from '@/hooks/use-chat-input'
import { useFileAttachment } from '@/hooks/use-file-attachment'
import { useChatContext } from '@/lib/context/chat-context'

const TASK_OPTIONS: { value: TaskType; label: string; placeholder: string }[] = [
  { label: 'Explain', placeholder: 'Paste code to explain…', value: 'explain' },
  { label: 'Generate Tests', placeholder: 'Paste code to test…', value: 'test' },
  { label: 'Refactor', placeholder: 'Paste code to refactor…', value: 'refactor' },
  { label: 'Write Commit', placeholder: 'Paste a git diff or describe your changes…', value: 'commit' },
]

const CHAR_AMBER_THRESHOLD = 7000

function charCountColorClass(overLimit: boolean, charCount: number): string {
  if (overLimit) {
    return 'font-medium text-destructive'
  }
  if (charCount > CHAR_AMBER_THRESHOLD) {
    return 'text-amber-500'
  }
  return 'text-muted-foreground'
}

const TASK_COLORS: Record<TaskType, string> = {
  commit: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-transparent',
  explain: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent',
  refactor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-transparent',
  test: 'bg-green-500/10 text-green-600 dark:text-green-400 border-transparent',
}

export function ChatInput() {
  const { isLoading, fixedTaskType, setActiveTask, handleCancel, handleClearHistory, entries } = useChatContext()
  const [input, setInput] = useState('')

  const { attachedFileName, fileInputRef, onFileChange, removeFile } = useFileAttachment((content) => {
    setInput(content)
  }, MAX_CHARS)

  const { displayTask, currentOption, charCount, overLimit, modelLabel, onSubmit, onKeyDown } = useChatInput(
    input,
    setInput,
    attachedFileName,
  )

  return (
    <div className="border-t border-border/60 bg-background/95 p-3 backdrop-blur-sm md:p-4">
      {attachedFileName && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/60 px-3 py-1.5 text-xs">
          <Paperclip className="h-3 w-3 text-muted-foreground" />
          <span className="flex-1 truncate font-mono text-foreground">{attachedFileName}</span>
          <button type="button" onClick={removeFile} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {!fixedTaskType && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {TASK_OPTIONS.map((taskOption) => (
            <button
              key={taskOption.value}
              type="button"
              onClick={() => setActiveTask(taskOption.value)}
              className={[
                'rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                displayTask === taskOption.value
                  ? TASK_COLORS[taskOption.value]
                  : 'border-border/60 text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {taskOption.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={currentOption?.placeholder ?? 'Paste code or text…'}
          className={[
            'max-h-48 resize-none overflow-y-auto pr-12 font-mono text-xs leading-relaxed',
            overLimit ? 'border-destructive focus-visible:ring-destructive' : '',
          ].join(' ')}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.kt,.rb,.cpp,.c,.cs,.php,.swift,.md,.txt,.json,.yaml,.yml,.toml,.sh"
          className="hidden"
          onChange={onFileChange}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Paperclip className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Attach a file</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          <Badge variant="outline" className="hidden shrink-0 gap-1 font-mono text-[10px] sm:flex">
            <span className="text-muted-foreground">model</span>
            <span>{modelLabel}</span>
          </Badge>
          <span className={`text-[10px] tabular-nums ${charCountColorClass(overLimit, charCount)}`}>
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
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
          {isLoading ? (
            <Button type="button" variant="outline" size="sm" onClick={handleCancel} className="h-8 gap-1.5">
              <Square className="h-3 w-3 fill-current" />
              Stop
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  onClick={onSubmit}
                  disabled={!input.trim() || overLimit}
                  className="h-8 gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                  <kbd className="hidden rounded border border-primary-foreground/30 px-1 py-0.5 font-mono text-[9px] opacity-70 sm:inline">
                    ⌘↵
                  </kbd>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send (⌘+Enter)</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}
