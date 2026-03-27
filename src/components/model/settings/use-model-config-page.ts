import { isModelInstalled } from './helpers'
import { useInstalledModels } from './use-installed-models'
import { useModelPull } from './use-model-pull'
import { usePersistedModelConfig } from './use-persisted-model-config'
import { useRuntimeModelDetails } from './use-runtime-model-details'

export function useModelConfigPage() {
  const persisted = usePersistedModelConfig()
  const isLocalRuntime = persisted.modelRuntime === 'local' || persisted.modelRuntime === 'small'
  const { installedModels, setInstalledModels } = useInstalledModels(persisted.ollamaBaseUrl, isLocalRuntime)
  const { pullStates, handlePull } = useModelPull(setInstalledModels)
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
