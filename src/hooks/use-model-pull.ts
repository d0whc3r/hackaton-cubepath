import { useCallback, useEffect, useRef, useState } from 'react'
import type { PullEvent } from '@/lib/ollama/pull-stream'
import { streamModelPull } from '@/lib/ollama/pull-stream'

export type ModelPullStatus = 'idle' | 'pulling' | 'ready' | 'error'

export interface ModelPullState {
  error?: string
  progress?: string
  status: ModelPullStatus
}

function formatProgress(event: PullEvent): string | undefined {
  if (typeof event.completed === 'number' && typeof event.total === 'number' && event.total > 0) {
    return `${Math.round((event.completed / event.total) * 100)}%`
  }
  return event.status ?? undefined
}

/**
 * Manages the lifecycle of an Ollama model pull with reactive state.
 * Treats both an explicit 'success' event and a clean stream-end as ready.
 * Aborts automatically on unmount.
 */
export function useModelPull(baseUrl: string, modelId: string) {
  const [state, setState] = useState<ModelPullState>({ status: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    [],
  )

  const pull = useCallback(async () => {
    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort
    setState({ status: 'pulling' })

    try {
      const result = await streamModelPull(baseUrl, modelId, abort.signal, (event: PullEvent) => {
        setState((prev) => ({ ...prev, progress: formatProgress(event) }))
      })

      setState(result.type === 'error' ? { error: result.message, status: 'error' } : { status: 'ready' })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      setState({ error: 'Could not reach Ollama. Is it running?', status: 'error' })
    }
  }, [baseUrl, modelId])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ status: 'idle' })
  }, [])

  return { pull, reset, state }
}
