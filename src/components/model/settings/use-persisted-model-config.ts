import { useEffect, useState } from 'react'
import type { ModelConfig } from '@/lib/config/model-config'
import { DEFAULTS, STORAGE_KEY, loadModelConfig } from '@/lib/config/model-config'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'
import { removeStorage, writeStorage } from '@/lib/utils/storage'
import type { SectionDef, SectionId } from './types'
import { CUSTOM_VALUE } from './constants'
import { buildInitialCustomModels, getActiveSection, getDefaultModelId } from './helpers'

const COPY_TIMEOUT_MS = 2000

function getDefaultModelForSection(section: SectionDef) {
  return getDefaultModelId(section)
}

export function usePersistedModelConfig() {
  const [config, setConfig] = useState<ModelConfig>(DEFAULTS)
  const [customModels, setCustomModels] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState<SectionId>('analyst')
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(OLLAMA_BASE_URL_DEFAULT)
  const [copiedModelId, setCopiedModelId] = useState<string | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<ModelConfig>(DEFAULTS)

  useEffect(() => {
    const loaded = loadModelConfig()
    setConfig(loaded)
    setOllamaBaseUrl(loaded.ollamaBaseUrl)
    setCustomModels(buildInitialCustomModels(loaded))
    setSavedSnapshot(loaded)
  }, [])

  const activeSectionDef = getActiveSection(activeSection)
  const activeModelId = config[activeSectionDef.configKey] as string
  const activeIsCustom = activeSection in customModels
  const currentSnapshot: ModelConfig = { ...config, ollamaBaseUrl }
  const isDirty = JSON.stringify(currentSnapshot) !== JSON.stringify(savedSnapshot)

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

  function handleSave() {
    const nextSnapshot = { ...config, ollamaBaseUrl }
    writeStorage(STORAGE_KEY, nextSnapshot)
    setSavedSnapshot(nextSnapshot)
    globalThis.history.back()
  }

  function handleReset() {
    setConfig(DEFAULTS)
    setCustomModels({})
    setOllamaBaseUrl(OLLAMA_BASE_URL_DEFAULT)
    removeStorage(STORAGE_KEY)
    setSavedSnapshot(DEFAULTS)
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
    getDefaultModelForSection,
    getSelectValue,
    handleCopyPull,
    handleCustomModelChange,
    handleModelChange,
    handleReset,
    handleSave,
    isCustom,
    isDirty,
    ollamaBaseUrl,
    setActiveSection,
    setOllamaBaseUrl,
  }
}
