import type { TaskType } from '@/lib/schemas/route'

import { useChatContext } from '@/lib/context/chat-context'
import { MODELS_BY_TASK } from '@/lib/router/models'

const TASK_OPTIONS: { value: TaskType; label: string; placeholder: string }[] = [
  { label: 'Explain', placeholder: 'Paste code to explain…', value: 'explain' },
  { label: 'Generate Tests', placeholder: 'Paste code to test…', value: 'test' },
  { label: 'Refactor', placeholder: 'Paste code to refactor…', value: 'refactor' },
  { label: 'Write Commit', placeholder: 'Paste a git diff or describe your changes…', value: 'commit' },
]

export const MAX_CHARS = 8000

export interface UseChatInputReturn {
  readonly displayTask: TaskType
  readonly currentOption: { value: TaskType; label: string; placeholder: string } | undefined
  readonly charCount: number
  readonly overLimit: boolean
  readonly modelLabel: string
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export function useChatInput(
  input: string,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  attachedFileName?: string | null,
): UseChatInputReturn {
  const { isLoading, activeTask, fixedTaskType, handleSubmit, currentModel } = useChatContext()

  const displayTask = fixedTaskType ?? activeTask
  const currentOption = TASK_OPTIONS.find((t) => t.value === displayTask)
  const charCount = input.length
  const overLimit = charCount > MAX_CHARS
  const modelLabel = MODELS_BY_TASK[displayTask].find((m) => m.id === currentModel)?.label ?? currentModel

  function onSubmit() {
    const text = input.trim()
    if (!text || overLimit || isLoading) {
      return
    }
    handleSubmit(text, displayTask, attachedFileName ?? undefined)
    setInput('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return {
    charCount,
    currentOption,
    displayTask,
    modelLabel,
    onKeyDown,
    onSubmit,
    overLimit,
  }
}
