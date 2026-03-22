import { ErrorExplainComposer } from '@/components/chat/ErrorExplainComposer'
import { TaskApp } from '@/components/chat/TaskApp'

export function ErrorExplainApp() {
  return (
    <TaskApp
      fixedTaskType="error-explain"
      pageTitle="Error Explain"
      pageDescription="Paste an error message and optional code snippet to get a root-cause explanation."
      composer={<ErrorExplainComposer />}
    />
  )
}
