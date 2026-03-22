import { useState } from 'react'

import type { TaskType } from '../lib/router/types'

const TASK_BUTTONS: { label: string; value: TaskType }[] = [
  { label: 'Explain', value: 'explain' },
  { label: 'Generate Tests', value: 'test' },
  { label: 'Refactor', value: 'refactor' },
  { label: 'Write Commit', value: 'commit' },
]

interface TaskTypeButtonProps {
  label: string
  value: TaskType
  active: boolean
  onSelect: (value: TaskType) => void
}

function TaskTypeButton({ label, value, active, onSelect }: TaskTypeButtonProps) {
  function handleClick() {
    onSelect(value)
  }

  return (
    <button type="button" onClick={handleClick} aria-pressed={active}>
      {label}
    </button>
  )
}

interface TaskPanelProps {
  isLoading: boolean
  onSubmit: (input: string, taskType: TaskType) => void
  onCancel: () => void
  initialInput?: string
}

export function TaskPanel({ isLoading, onSubmit, onCancel, initialInput = '' }: TaskPanelProps) {
  const [input, setInput] = useState(initialInput)
  const [taskType, setTaskType] = useState<TaskType>('explain')

  function handleInputChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value)
  }

  function handleSubmit() {
    onSubmit(input, taskType)
  }

  return (
    <div>
      <div className="flex gap-2">
        {TASK_BUTTONS.map((btn) => (
          <TaskTypeButton
            key={btn.value}
            label={btn.label}
            value={btn.value}
            active={taskType === btn.value}
            onSelect={setTaskType}
          />
        ))}
      </div>

      <textarea placeholder="Paste your code here..." value={input} onChange={handleInputChange} />

      <button type="button" disabled={isLoading || !input} onClick={handleSubmit}>
        {isLoading ? 'Processing...' : 'Submit'}
      </button>

      {isLoading && (
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  )
}
