import { useCallback } from 'react'

export function useSubmitShortcut(onSubmit: () => void) {
  return useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        onSubmit()
      }
    },
    [onSubmit],
  )
}
