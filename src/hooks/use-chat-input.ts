import type { TaskType } from '@/lib/schemas/route'
import { useSubmitShortcut } from '@/hooks/use-submit-shortcut'
import { useChatContext } from '@/lib/context/chat-context'
import { MODELS_BY_TASK } from '@/lib/router/models'

const TASK_OPTIONS: { value: TaskType; label: string; placeholder: string }[] = [
  { label: 'Explain', placeholder: 'Paste code to explain…', value: 'explain' },
  { label: 'Generate Tests', placeholder: 'Paste code to test…', value: 'test' },
  { label: 'Refactor', placeholder: 'Paste code to refactor…', value: 'refactor' },
  { label: 'Write Commit', placeholder: 'Paste a git diff or describe your changes…', value: 'commit' },
]

export const MAX_CHARS = 15_000

interface UseChatInputReturn {
  displayTask: TaskType
  currentOption: { value: TaskType; label: string; placeholder: string } | undefined
  charCount: number
  overLimit: boolean
  modelLabel: string
  onSubmit: () => void
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export function useChatInput(
  input: string,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  attachedFileName?: string | null,
): UseChatInputReturn {
  const { isLoading, activeTask, fixedTaskType, handleSubmit, currentModel } = useChatContext()

  const displayTask = fixedTaskType ?? activeTask
  const currentOption = TASK_OPTIONS.find((task) => task.value === displayTask)
  const charCount = input.length
  const overLimit = charCount > MAX_CHARS
  const modelLabel = MODELS_BY_TASK[displayTask].find((model) => model.id === currentModel)?.label ?? currentModel

  function onSubmit() {
    const text = input.trim()
    if (!text || overLimit || isLoading) {
      return
    }
    handleSubmit(text, displayTask, attachedFileName ?? undefined)
    setInput('')
  }

  const onKeyDown = useSubmitShortcut(onSubmit)

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
