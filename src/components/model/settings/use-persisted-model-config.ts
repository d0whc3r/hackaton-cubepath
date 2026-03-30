import { useEffect, useState } from 'react'
import type { ModelConfig } from '@/lib/config/model-config'
import type { ModelRuntime } from '@/lib/router/types'
import {
  DEFAULTS,
  buildDefaultsForRuntime,
  loadModelConfigAsync,
  removeModelConfig,
  saveModelConfig,
} from '@/lib/config/model-config'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/ollama-defaults'
import type { SectionDef, SectionId } from './types'
import { CUSTOM_VALUE, getSectionsForRuntime } from './constants'
import { buildInitialCustomModels, getActiveSection, getDefaultModelIdForRuntime } from './helpers'

const COPY_TIMEOUT_MS = 2000

export function usePersistedModelConfig() {
  const [config, setConfig] = useState<ModelConfig>(DEFAULTS)
  const [modelRuntime, setModelRuntime] = useState<ModelRuntime>(DEFAULTS.modelRuntime)
  const [customModels, setCustomModels] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState<SectionId>('analyst')
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(OLLAMA_BASE_URL_DEFAULT)
  const [copiedModelId, setCopiedModelId] = useState<string | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<ModelConfig>(DEFAULTS)
  const [savedModelRuntime, setSavedModelRuntime] = useState<ModelRuntime>(DEFAULTS.modelRuntime)
  const sections = getSectionsForRuntime(modelRuntime)

  useEffect(() => {
    void loadModelConfigAsync().then((loaded) => {
      setConfig(loaded)
      setModelRuntime(loaded.modelRuntime)
      setOllamaBaseUrl(loaded.ollamaBaseUrl)
      setCustomModels(buildInitialCustomModels(loaded, getSectionsForRuntime(loaded.modelRuntime)))
      setSavedSnapshot(loaded)
      setSavedModelRuntime(loaded.modelRuntime)
    })
  }, [])

  const activeSectionDef = getActiveSection(activeSection, sections)
  const activeModelId = config[activeSectionDef.configKey] as string
  const activeIsCustom = activeSection in customModels
  const currentSnapshot: ModelConfig = { ...config, modelRuntime, ollamaBaseUrl }
  const isDirty =
    modelRuntime !== savedModelRuntime || JSON.stringify(currentSnapshot) !== JSON.stringify(savedSnapshot)

  function handleModelChange(section: SectionDef, value: string) {
    setActiveSection(section.id)

    if (value === CUSTOM_VALUE) {
      setCustomModels((previous) => ({
        ...previous,
        [section.id]: config[section.configKey] || '',
      }))
      return
    }

    setConfig((previous) => ({ ...previous, [section.configKey]: value }))
    setCustomModels((previous) => {
      const next = { ...previous }
      delete next[section.id]
      return next
    })
  }

  function handleCustomModelChange(section: SectionDef, value: string) {
    setCustomModels((previous) => ({ ...previous, [section.id]: value }))
    setConfig((previous) => ({ ...previous, [section.configKey]: value }))
  }

  function handleModelRuntimeChange(nextRuntime: ModelRuntime) {
    if (nextRuntime === modelRuntime) {
      return
    }

    const nextDefaults = buildDefaultsForRuntime(nextRuntime)
    const nextConfig = { ...nextDefaults, ollamaBaseUrl }
    setModelRuntime(nextRuntime)
    setConfig(nextConfig)
    setCustomModels({})
    setActiveSection('analyst')
  }

  async function handleSave() {
    const nextSnapshot = { ...config, modelRuntime, ollamaBaseUrl }
    await saveModelConfig(nextSnapshot)
    setSavedSnapshot(nextSnapshot)
    setSavedModelRuntime(modelRuntime)
    globalThis.history.back()
  }

  function handleReset() {
    setConfig(DEFAULTS)
    setModelRuntime(DEFAULTS.modelRuntime)
    setCustomModels({})
    setOllamaBaseUrl(OLLAMA_BASE_URL_DEFAULT)
    void removeModelConfig()
    setSavedSnapshot(DEFAULTS)
    setSavedModelRuntime(DEFAULTS.modelRuntime)
  }

  function handleCopyPull(modelId: string) {
    void navigator.clipboard.writeText(`ollama pull ${modelId}`)
    setCopiedModelId(modelId)
    setTimeout(() => setCopiedModelId(null), COPY_TIMEOUT_MS)
  }

  function isCustom(sectionId: SectionId) {
    return sectionId in customModels
  }

  function getSelectValue(section: SectionDef): string {
    const currentValue = config[section.configKey]
    const isKnown = section.models.some((model) => model.id === currentValue)
    const custom = section.id in customModels
    return custom || !isKnown ? CUSTOM_VALUE : currentValue
  }

  return {
    activeIsCustom,
    activeModelId,
    activeSection,
    activeSectionDef,
    config,
    copiedModelId,
    customModels,
    getDefaultModelForSection: (section: SectionDef) => getDefaultModelIdForRuntime(section, modelRuntime),
    getSelectValue,
    handleCopyPull,
    handleCustomModelChange,
    handleModelChange,
    handleModelRuntimeChange,
    handleReset,
    handleSave,
    isCustom,
    isDirty,
    modelRuntime,
    ollamaBaseUrl,
    sections,
    setActiveSection,
    setOllamaBaseUrl,
  }
}
