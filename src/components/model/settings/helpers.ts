import type { ModelConfig } from '@/lib/config/model-config'
import type { ModelOption } from '@/lib/router/types'
import { buildDefaultsForRuntime } from '@/lib/config/model-config'
import type { SectionDef, SectionId } from './types'
import { SECTIONS } from './constants'

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

export function buildInitialCustomModels(
  config: ModelConfig,
  sections: SectionDef[] = SECTIONS,
): Record<string, string> {
  const custom: Record<string, string> = {}

  for (const section of sections) {
    const value = config[section.configKey] as string
    const isKnown = section.models.some((model) => model.id === value)
    if (!isKnown && value) {
      custom[section.id] = value
    }
  }

  return custom
}

export function getDefaultModelIdForRuntime(section: SectionDef, modelRuntime: ModelConfig['modelRuntime']): string {
  return buildDefaultsForRuntime(modelRuntime)[section.configKey] as string
}

export function getActiveSection(activeSection: SectionId, sections: SectionDef[] = SECTIONS): SectionDef {
  return sections.find((section) => section.id === activeSection) ?? sections[0]
}

export function getModelSizeGb(model: ModelOption): number {
  return model.size
}

export function buildModelSizeIndex(sections: SectionDef[] = SECTIONS): Map<string, number> {
  const byId = new Map<string, number>()
  for (const section of sections) {
    for (const model of section.models) {
      const sizeGb = getModelSizeGb(model)
      if (byId.has(model.id)) {
        continue
      }
      byId.set(model.id, sizeGb)
    }
  }
  return byId
}

export function getUniqueSelectedModelIds(config: ModelConfig, sections: SectionDef[] = SECTIONS): string[] {
  return [...new Set(sections.map((section) => config[section.configKey] as string).filter(Boolean))]
}

export function getUniqueSelectedSizeGb(config: ModelConfig, sections: SectionDef[] = SECTIONS): number {
  const sizeByModel = buildModelSizeIndex(sections)
  return getUniqueSelectedModelIds(config, sections).reduce(
    (total, modelId) => total + (sizeByModel.get(modelId) ?? 0),
    0,
  )
}

export function formatGb(value: number): string {
  if (value >= 10) {
    return `${value.toFixed(1)} GB`
  }
  return `${value.toFixed(2)} GB`
}

export function formatModelSizeGb(model: ModelOption): string {
  if (model.size <= 0) {
    return 'Cloud'
  }
  return formatGb(getModelSizeGb(model))
}
