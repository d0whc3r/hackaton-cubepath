import { useQuery } from '@tanstack/react-query'
import type { ModelConfig } from '@/lib/config/model-config'
import type { OllamaHealthRaw } from '@/lib/query/ollama'
import { SECTIONS } from '@/components/model/settings/constants'
import { ollamaHealthOptions } from '@/lib/query/ollama'

export type OllamaHealthStatus = 'loading' | 'healthy' | 'degraded' | 'unreachable' | 'stale'

export interface MissingModel {
  title: string
  modelId: string
}

export interface OllamaHealth {
  status: OllamaHealthStatus
  ollamaVersion: string | null
  installedModels: string[]
  /** Tasks (sections) whose assigned model is not installed */
  missingModels: MissingModel[]
  /** Total number of task sections */
  totalTasks: number
  /** Tasks whose assigned model is installed */
  readyTasks: number
  /** Unique model IDs required across all task sections */
  totalUniqueModels: number
  /** Unique required model IDs that are currently installed */
  installedUniqueModels: number
  checkedAt: string | null
  /** URL that was used for the last completed check */
  checkedUrl: string | null
}

const TOTAL_TASKS = SECTIONS.length

const INITIAL_HEALTH: OllamaHealth = {
  checkedAt: null,
  checkedUrl: null,
  installedModels: [],
  installedUniqueModels: 0,
  missingModels: [],
  ollamaVersion: null,
  readyTasks: 0,
  status: 'loading',
  totalTasks: TOTAL_TASKS,
  totalUniqueModels: 0,
}

function computeHealth(response: OllamaHealthRaw, config: ModelConfig): OllamaHealth {
  const requiredModelIds = [...new Set(SECTIONS.map((section) => config[section.configKey]).filter(Boolean))]

  if (!response.ollamaReachable) {
    return {
      checkedAt: response.checkedAt,
      checkedUrl: config.ollamaBaseUrl,
      installedModels: [],
      installedUniqueModels: 0,
      missingModels: [],
      ollamaVersion: null,
      readyTasks: 0,
      status: 'unreachable',
      totalTasks: TOTAL_TASKS,
      totalUniqueModels: requiredModelIds.length,
    }
  }

  const missingModels = SECTIONS.flatMap((section) => {
    const modelId = config[section.configKey]
    if (!modelId || response.installedModels.includes(modelId)) {
      return []
    }
    return [{ modelId, title: section.title }]
  })

  const installedUniqueModels = requiredModelIds.filter((id) => response.installedModels.includes(id)).length

  return {
    checkedAt: response.checkedAt,
    checkedUrl: config.ollamaBaseUrl,
    installedModels: response.installedModels,
    installedUniqueModels,
    missingModels,
    ollamaVersion: response.ollamaVersion,
    readyTasks: TOTAL_TASKS - missingModels.length,
    status: missingModels.length > 0 ? 'degraded' : 'healthy',
    totalTasks: TOTAL_TASKS,
    totalUniqueModels: requiredModelIds.length,
  }
}

/**
 * Checks Ollama health via React Query. Re-fetches whenever `triggerKey` changes
 * (user clicks refresh) or when `ollamaBaseUrl` changes (new URL saved).
 */
export function useOllamaHealth(config: ModelConfig, triggerKey: number, enabled: boolean): OllamaHealth {
  const { data, isPending } = useQuery(ollamaHealthOptions(config.ollamaBaseUrl, triggerKey, enabled))

  if (!enabled) {
    return {
      ...INITIAL_HEALTH,
      checkedAt: new Date().toISOString(),
      checkedUrl: config.ollamaBaseUrl,
      status: 'healthy',
    }
  }

  if (isPending || !data) {
    return { ...INITIAL_HEALTH }
  }

  return computeHealth(data, config)
}
