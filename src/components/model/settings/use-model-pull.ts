import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { appWretch } from '@/lib/http/app-client'
import type { PullState } from './types'

interface PullEvent {
  completed?: number
  error?: string
  status?: string
  total?: number
}

const PERCENT_BASE = 100

function parsePullEvent(line: string): PullEvent | null {
  if (!line.startsWith('data:')) {
    return null
  }

  try {
    return JSON.parse(line.slice(5).trim()) as PullEvent
  } catch {
    return null
  }
}

export function useModelPull(setInstalledModels: React.Dispatch<React.SetStateAction<string[] | null>>) {
  const [pullStates, setPullStates] = useState<Record<string, PullState>>({})
  const pullAborts = useRef<Record<string, AbortController>>({})

  useEffect(
    () => () => {
      for (const abort of Object.values(pullAborts.current)) {
        abort.abort()
      }
    },
    [],
  )

  function applySuccessEvent(modelId: string): void {
    toast.success(`Model pulled`, { description: modelId })
    setPullStates((previous) => ({ ...previous, [modelId]: { status: 'done' } }))
    setInstalledModels((previous) => {
      if (!previous) {
        return [modelId]
      }
      return previous.includes(modelId) ? previous : [...previous, modelId]
    })
  }

  function applyPullEvent(modelId: string, event: PullEvent): boolean {
    if (event.status === 'success') {
      applySuccessEvent(modelId)
      return true
    }

    if (event.status === 'error' || event.error) {
      const message = typeof event.error === 'string' ? event.error : 'Pull failed'
      toast.error(`Pull failed: ${modelId}`, { description: message })
      setPullStates((previous) => ({ ...previous, [modelId]: { error: message, status: 'error' } }))
      return true
    }

    const hasProgress = typeof event.completed === 'number' && typeof event.total === 'number' && event.total > 0
    const progressLabel = hasProgress
      ? `${Math.round((event.completed! / event.total!) * PERCENT_BASE)}%`
      : (event.status ?? 'Pulling…')

    setPullStates((previous) => ({ ...previous, [modelId]: { progress: progressLabel, status: 'pulling' } }))
    return false
  }

  function handlePull(modelId: string, baseUrl: string) {
    pullAborts.current[modelId]?.abort()

    const abort = new AbortController()
    pullAborts.current[modelId] = abort
    setPullStates((previous) => ({ ...previous, [modelId]: { status: 'pulling' } }))

    appWretch
      .url('/api/ollama/pull')
      .options({ signal: abort.signal })
      .post({ baseUrl, model: modelId })
      .res()
      .then(async (response) => {
        if (!response.body) {
          throw new Error('No stream')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const event = parsePullEvent(line)
            if (event && applyPullEvent(modelId, event)) {
              return
            }
          }
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        toast.error(`Pull failed: ${modelId}`, { description: 'Connection failed. Is Ollama running?' })
        setPullStates((previous) => ({
          ...previous,
          [modelId]: { error: 'Connection failed', status: 'error' },
        }))
      })
  }

  return { handlePull, pullStates }
}
