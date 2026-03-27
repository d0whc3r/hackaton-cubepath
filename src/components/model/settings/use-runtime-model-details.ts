import { useEffect, useState } from 'react'
import { appWretch } from '@/lib/http/app-client'
import type { RuntimeModelDetails } from './types'

export function useRuntimeModelDetails(ollamaBaseUrl: string, modelId: string, enabled: boolean) {
  const [cache, setCache] = useState<Record<string, RuntimeModelDetails>>({})
  const cacheKey = `${ollamaBaseUrl}::${modelId}`
  const runtimeModelDetails = cache[cacheKey] ?? null

  useEffect(() => {
    if (!enabled || !modelId.trim() || cache[cacheKey]) {
      return
    }

    const abort = new AbortController()
    appWretch
      .url('/api/ollama/model')
      .query({ baseUrl: ollamaBaseUrl, model: modelId })
      .options({ signal: abort.signal })
      .get()
      .json<{ details?: RuntimeModelDetails | null }>()
      .then((payload) => {
        if (!payload.details) {
          return
        }
        setCache((previous) => ({ ...previous, [cacheKey]: payload.details as RuntimeModelDetails }))
      })
      .catch(() => {
        // Silently ignore AbortError and transient fetch errors
      })

    return () => abort.abort()
  }, [cache, cacheKey, enabled, modelId, ollamaBaseUrl])

  return { runtimeModelDetails }
}
