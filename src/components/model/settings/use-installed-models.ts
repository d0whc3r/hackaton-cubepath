import { useEffect, useState } from 'react'
import { appWretch } from '@/lib/http/app-client'

export function useInstalledModels(ollamaBaseUrl: string, enabled: boolean) {
  const [installedModels, setInstalledModels] = useState<string[] | null>(null)

  useEffect(() => {
    if (!enabled) {
      setInstalledModels([])
      return
    }

    const abort = new AbortController()

    setInstalledModels(null)
    appWretch
      .url('/api/ollama/models')
      .query({ baseUrl: ollamaBaseUrl })
      .options({ signal: abort.signal })
      .get()
      .json<{ models?: string[] }>()
      .then((data) => setInstalledModels(data.models ?? []))
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        setInstalledModels([])
      })

    return () => abort.abort()
  }, [enabled, ollamaBaseUrl])

  return { installedModels, setInstalledModels }
}
