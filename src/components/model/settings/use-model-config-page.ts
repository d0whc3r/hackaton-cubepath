import { useModelPullMutation } from '@/lib/query/ollama'
import { isModelInstalled } from './helpers'
import { useInstalledModels } from './use-installed-models'
import { usePersistedModelConfig } from './use-persisted-model-config'
import { useRuntimeModelDetails } from './use-runtime-model-details'

export function useModelConfigPage() {
  const persisted = usePersistedModelConfig()
  const isLocalRuntime = persisted.modelRuntime === 'local' || persisted.modelRuntime === 'small'
  const { installedModels } = useInstalledModels(persisted.ollamaBaseUrl, isLocalRuntime)
  const { pullStates, handlePull } = useModelPullMutation()
  const { runtimeModelDetails } = useRuntimeModelDetails(
    persisted.ollamaBaseUrl,
    persisted.activeModelId,
    isLocalRuntime,
  )

  const activeModelInstalled = !isLocalRuntime || isModelInstalled(installedModels, persisted.activeModelId)

  return {
    ...persisted,
    activeModelInstalled,
    handlePull,
    installedModels,
    pullStates,
    runtimeModelDetails,
  }
}
