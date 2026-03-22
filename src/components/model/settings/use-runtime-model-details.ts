import { useEffect, useState } from 'react'

import type { RuntimeModelDetails } from './types'

export function useRuntimeModelDetails(ollamaBaseUrl: string, modelId: string) {
  const [cache, setCache] = useState<Record<string, RuntimeModelDetails>>({})
  const cacheKey = `${ollamaBaseUrl}::${modelId}`
  const runtimeModelDetails = cache[cacheKey] ?? null

  useEffect(() => {
    if (!modelId.trim() || cache[cacheKey]) {
      return
    }

    const abort = new AbortController()
    fetch(`/api/ollama/model?baseUrl=${encodeURIComponent(ollamaBaseUrl)}&model=${encodeURIComponent(modelId)}`, {
      signal: abort.signal,
    })
      .then((response) => response.json() as Promise<{ details?: RuntimeModelDetails | null }>)
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
  }, [cache, cacheKey, modelId, ollamaBaseUrl])

  return { runtimeModelDetails }
}
