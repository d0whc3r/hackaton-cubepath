import { useQuery } from '@tanstack/react-query'
import { installedModelsOptions } from '@/lib/query/ollama'

export function useInstalledModels(ollamaBaseUrl: string, enabled: boolean) {
  const { data: installedModels = null } = useQuery(installedModelsOptions(ollamaBaseUrl, enabled))
  return { installedModels }
}
