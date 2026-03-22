import { isModelInstalled } from './helpers'
import { useInstalledModels } from './use-installed-models'
import { useModelPull } from './use-model-pull'
import { usePersistedModelConfig } from './use-persisted-model-config'
import { useRuntimeModelDetails } from './use-runtime-model-details'

export function useModelConfigPage() {
  const persisted = usePersistedModelConfig()
  const { installedModels, setInstalledModels } = useInstalledModels(persisted.ollamaBaseUrl)
  const { pullStates, handlePull } = useModelPull(setInstalledModels)
  const { runtimeModelDetails } = useRuntimeModelDetails(persisted.ollamaBaseUrl, persisted.activeModelId)

  const activeModelInstalled = isModelInstalled(installedModels, persisted.activeModelId)

  return {
    ...persisted,
    activeModelInstalled,
    handlePull,
    installedModels,
    pullStates,
    runtimeModelDetails,
  }
}
