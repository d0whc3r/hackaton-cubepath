import type { ModelConfig } from '@/lib/config/model-config'
import { DEFAULTS } from '@/lib/config/model-config'
import type { SectionDef, SectionId } from './types'
import { CUSTOM_VALUE, SECTIONS } from './constants'

export function ollamaModelUrl(modelId: string): string {
  const withoutTag = modelId.replace(/:.*$/, '')
  if (withoutTag.includes('/')) {
    return `https://ollama.com/${withoutTag}`
  }
  return `https://ollama.com/library/${withoutTag}`
}

export function isModelInstalled(installedModels: string[] | null, modelId: string): boolean {
  if (!installedModels) {
    return false
  }

  return installedModels.some(
    (installedModel) =>
      installedModel === modelId ||
      installedModel.startsWith(`${modelId}:`) ||
      modelId.startsWith(`${installedModel}:`),
  )
}

export function buildInitialCustomModels(config: ModelConfig): Record<string, string> {
  const custom: Record<string, string> = {}

  for (const section of SECTIONS) {
    const value = config[section.configKey] as string
    const isKnown = section.models.some((model) => model.id === value)
    if (!isKnown && value) {
      custom[section.id] = value
    }
  }

  return custom
}

export function getSelectValue(section: SectionDef, config: ModelConfig, customModels: Record<string, string>): string {
  const currentValue = config[section.configKey] as string
  const isKnown = section.models.some((model) => model.id === currentValue)
  const isCustom = section.id in customModels

  return isCustom || !isKnown ? CUSTOM_VALUE : currentValue
}

export function getDefaultModelId(section: SectionDef): string {
  return DEFAULTS[section.configKey] as string
}

export function getActiveSection(activeSection: SectionId): SectionDef {
  return SECTIONS.find((section) => section.id === activeSection) ?? SECTIONS[0]
}
