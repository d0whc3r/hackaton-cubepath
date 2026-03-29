import { useQuery } from '@tanstack/react-query'
import { modelDetailsOptions } from '@/lib/query/ollama'

export function useRuntimeModelDetails(ollamaBaseUrl: string, modelId: string, enabled: boolean) {
  const { data: runtimeModelDetails = null } = useQuery(modelDetailsOptions(ollamaBaseUrl, modelId, enabled))
  return { runtimeModelDetails }
}
