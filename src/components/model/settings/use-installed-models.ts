import { useEffect, useState } from 'react'

export function useInstalledModels(ollamaBaseUrl: string) {
  const [installedModels, setInstalledModels] = useState<string[] | null>(null)

  useEffect(() => {
    const abort = new AbortController()

    setInstalledModels(null)
    fetch(`/api/ollama/models?baseUrl=${encodeURIComponent(ollamaBaseUrl)}`, { signal: abort.signal })
      .then((response) => response.json() as Promise<{ models?: string[] }>)
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
