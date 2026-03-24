import { useEffect, useState } from 'react'
import { appWretch } from '@/lib/http/app-client'

export function useInstalledModels(ollamaBaseUrl: string) {
  const [installedModels, setInstalledModels] = useState<string[] | null>(null)

  useEffect(() => {
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
  }, [ollamaBaseUrl])

  return { installedModels, setInstalledModels }
}
