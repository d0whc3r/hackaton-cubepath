import { useEffect, useRef, useState } from 'react'
import type { ModelConfig } from '@/lib/config/model-config'
import type { OllamaHealthResponse } from '@/pages/api/ollama/health'
import { SECTIONS } from '@/components/model/settings/constants'
import { appWretch } from '@/lib/http/app-client'

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

function computeHealth(response: OllamaHealthResponse, config: ModelConfig): OllamaHealth {
  // All unique model IDs required by the current config
  const requiredModelIds = [
    ...new Set(SECTIONS.map((section) => config[section.configKey as keyof ModelConfig] as string).filter(Boolean)),
  ]

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
    const modelId = config[section.configKey as keyof ModelConfig] as string
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
 * Fetches Ollama health on mount and whenever `triggerKey` changes (i.e. user
 * clicks the refresh button). URL changes alone do NOT trigger a new request —
 * they transition the status to 'stale' so the UI can prompt the user to verify.
 */
export function useOllamaHealth(config: ModelConfig, triggerKey: number): OllamaHealth {
  const [health, setHealth] = useState<OllamaHealth>(INITIAL_HEALTH)
  const triggeredUrlRef = useRef<string>(config.ollamaBaseUrl)

  useEffect(() => {
    const abort = new AbortController()
    const urlToCheck = config.ollamaBaseUrl
    triggeredUrlRef.current = urlToCheck

    setHealth((previous) => ({ ...previous, status: 'loading' }))

    appWretch
      .url('/api/ollama/health')
      .query({ baseUrl: urlToCheck })
      .options({ signal: abort.signal })
      .get()
      .json<OllamaHealthResponse>()
      .then((response) => {
        setHealth(computeHealth(response, config))
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        const requiredModelIds = [
          ...new Set(
            SECTIONS.map((section) => config[section.configKey as keyof ModelConfig] as string).filter(Boolean),
          ),
        ]
        setHealth({
          checkedAt: new Date().toISOString(),
          checkedUrl: urlToCheck,
          installedModels: [],
          installedUniqueModels: 0,
          missingModels: [],
          ollamaVersion: null,
          readyTasks: 0,
          status: 'unreachable',
          totalTasks: TOTAL_TASKS,
          totalUniqueModels: requiredModelIds.length,
        })
      })

    return () => {
      abort.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey])

  const isStale =
    health.status !== 'loading' && health.checkedUrl !== null && config.ollamaBaseUrl !== health.checkedUrl

  return isStale ? { ...health, status: 'stale' } : health
}
