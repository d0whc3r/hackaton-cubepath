import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useModelPull } from '@/hooks/use-model-pull'
import { loadModelConfig } from '@/lib/config/model-config'
import { guardCheckOptions } from '@/lib/query/ollama'
import { DEFAULT_GUARD_MODEL } from '@/lib/railguard/guard-models'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'

export interface GuardBootstrapState {
  error?: string
  modelId: string
  progress?: string
  status: 'checking' | 'pulling' | 'ready' | 'error'
}

function deriveState(
  checkQuery: { data?: boolean; isError: boolean; isPending: boolean },
  pullState: { error?: string; progress?: string; status: string },
): GuardBootstrapState {
  if (checkQuery.isError) {
    return { error: 'Could not reach Ollama. Is it running?', modelId: DEFAULT_GUARD_MODEL, status: 'error' }
  }
  if (checkQuery.isPending) {
    return { modelId: DEFAULT_GUARD_MODEL, status: 'checking' }
  }
  if (checkQuery.data === true || pullState.status === 'ready') {
    return { modelId: DEFAULT_GUARD_MODEL, status: 'ready' }
  }
  if (pullState.status === 'error') {
    return { error: pullState.error, modelId: DEFAULT_GUARD_MODEL, status: 'error' }
  }
  return { modelId: DEFAULT_GUARD_MODEL, progress: pullState.progress, status: 'pulling' }
}

export function useGuardBootstrap() {
  const [retryCount, setRetryCount] = useState(0)
  const baseUrl = loadModelConfig().ollamaBaseUrl ?? OLLAMA_BASE_URL_DEFAULT

  const checkQuery = useQuery(guardCheckOptions(baseUrl, retryCount))
  const { state: pullState, pull, reset: resetPull } = useModelPull(baseUrl, DEFAULT_GUARD_MODEL)

  useEffect(() => {
    if (checkQuery.data === false && pullState.status === 'idle') {
      void pull()
    }
  }, [checkQuery.data, pullState.status, pull])

  const retry = useCallback(() => {
    resetPull()
    setRetryCount((count) => count + 1)
  }, [resetPull])

  return { retry, state: deriveState(checkQuery, pullState) }
}
