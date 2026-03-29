/**
 * Centralised React Query configuration for all Ollama-related data.
 *
 *  ── Key factories   ──  predictable invalidation across the whole app
 *  ── queryOptions()  ──  typed option objects, use directly with useQuery / useSuspenseQuery
 *  ── Mutation hooks  ──  self-contained hooks that invalidate the right keys on success
 */
import { queryOptions, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { PullEvent } from '@/lib/ollama/pull-stream'
import { appWretch } from '@/lib/http/app-client'
import { streamModelPull } from '@/lib/ollama/pull-stream'
import { DEFAULT_GUARD_MODEL } from '@/lib/railguard/guard-models'
import { copyNotificationDetails, notify } from '@/lib/ui/notifications'

// ── Shared types ───────────────────────────────────────────────────────────────

export type PullStatus = 'idle' | 'pulling' | 'done' | 'error'

export interface PullState {
  error?: string
  progress?: string
  status: PullStatus
}

export interface RuntimeModelDetails {
  capabilities?: string[]
  contextLength?: number
  family?: string
  modifiedAt?: string
  parameterSize?: string
  quantizationLevel?: string
  sizeBytes?: number
}

export interface OllamaHealthRaw {
  checkedAt: string
  installedModels: string[]
  ollamaReachable: boolean
  ollamaVersion: string | null
}

// ── Utilities ──────────────────────────────────────────────────────────────────

export function normalizeModelName(name: string): string {
  const [base, tag] = name.split(':')
  return tag && tag !== 'latest' ? `${base}:${tag}` : (base ?? name)
}

// ── Key factories ──────────────────────────────────────────────────────────────
//
// Usage:
//   QueryClient.invalidateQueries({ queryKey: ollamaKeys.all() })        // all ollama
//   QueryClient.invalidateQueries({ queryKey: ollamaKeys.tags(url) })    // specific tags
//   QueryClient.invalidateQueries({ queryKey: ollamaKeys.health(url) })  // all health for url

export const ollamaKeys = {
  all: () => ['ollama'] as const,
  health: (baseUrl: string, triggerKey?: number) =>
    triggerKey === undefined
      ? ([...ollamaKeys.all(), 'health', baseUrl] as const)
      : ([...ollamaKeys.all(), 'health', baseUrl, triggerKey] as const),
  modelDetails: (baseUrl: string, modelId: string) => [...ollamaKeys.all(), 'model-details', baseUrl, modelId] as const,
  tags: (baseUrl: string) => [...ollamaKeys.all(), 'tags', baseUrl] as const,
} as const

export const guardKeys = {
  all: () => ['guard'] as const,
  check: (baseUrl: string, retryCount: number) =>
    [...guardKeys.all(), 'check', DEFAULT_GUARD_MODEL, baseUrl, retryCount] as const,
} as const

// ── Internal fetch helpers ─────────────────────────────────────────────────────

async function fetchTags(baseUrl: string, signal: AbortSignal): Promise<string[]> {
  const data = await appWretch
    .url(`${baseUrl}/api/tags`)
    .options({ signal })
    .get()
    .json<{ models?: { name: string }[] }>()
  return (data.models ?? []).map((model) => normalizeModelName(model.name))
}

const HEALTH_TIMEOUT_MS = 5000

export async function fetchOllamaHealthRaw(baseUrl: string, signal: AbortSignal): Promise<OllamaHealthRaw> {
  const combined = AbortSignal.any([signal, AbortSignal.timeout(HEALTH_TIMEOUT_MS)])
  try {
    const [versionRes, tagsRes] = await Promise.all([
      appWretch.url(`${baseUrl}/api/version`).options({ signal: combined }).get().res(),
      appWretch.url(`${baseUrl}/api/tags`).options({ signal: combined }).get().res(),
    ])

    if (!versionRes.ok || !tagsRes.ok) {
      return { checkedAt: new Date().toISOString(), installedModels: [], ollamaReachable: false, ollamaVersion: null }
    }

    const [versionData, tagsData] = await Promise.all([
      versionRes.json() as Promise<{ version?: string }>,
      tagsRes.json() as Promise<{ models?: { name: string }[] }>,
    ])

    return {
      checkedAt: new Date().toISOString(),
      installedModels: (tagsData.models ?? []).map((model) => {
        const [base, tag] = model.name.split(':')
        return tag && tag !== 'latest' ? `${base}:${tag}` : (base ?? model.name)
      }),
      ollamaReachable: true,
      ollamaVersion: versionData.version ?? null,
    }
  } catch {
    return { checkedAt: new Date().toISOString(), installedModels: [], ollamaReachable: false, ollamaVersion: null }
  }
}

interface ShowResponse {
  capabilities?: string[]
  details?: { family?: string; parameter_size?: string; quantization_level?: string }
  model_info?: Record<string, unknown>
  parameters?: string
}

interface TagsResponse {
  models?: { modified_at?: string; name?: string; size?: number }[]
}

function getContextLength(data: ShowResponse): number | undefined {
  for (const [key, value] of Object.entries(data.model_info ?? {})) {
    if (key.endsWith('.context_length') && typeof value === 'number') {
      return value
    }
  }
  const match = (data.parameters ?? '').match(/num_ctx\s+(\d+)/)
  return match ? Number(match[1]) : undefined
}

const MODEL_DETAILS_TIMEOUT_MS = 5000

// ── Query options factories ────────────────────────────────────────────────────
// These are plain option objects — pass them directly to useQuery / useSuspenseQuery:
//
//   Const { data } = useQuery(installedModelsOptions(baseUrl, isLocal))
//   Const { data } = useSuspenseQuery(modelDetailsOptions(baseUrl, modelId, isLocal))

/** Installed model list from Ollama /api/tags */
export const installedModelsOptions = (baseUrl: string, enabled: boolean) =>
  queryOptions({
    enabled,
    queryFn: ({ signal }) => fetchTags(baseUrl, signal),
    queryKey: ollamaKeys.tags(baseUrl),
    retry: false,
  })

/**
 * Raw Ollama health response — derive OllamaHealth in the consuming hook via computeHealth().
 * Key includes triggerKey so the user can force a re-check by incrementing it.
 */
export const ollamaHealthOptions = (baseUrl: string, triggerKey: number, enabled: boolean) =>
  queryOptions({
    enabled,
    queryFn: ({ signal }) => fetchOllamaHealthRaw(baseUrl, signal),
    queryKey: ollamaKeys.health(baseUrl, triggerKey),
    retry: false,
    staleTime: Infinity,
  })

/** Model metadata from /api/show + /api/tags */
export const modelDetailsOptions = (baseUrl: string, modelId: string, enabled: boolean) =>
  queryOptions({
    enabled: enabled && Boolean(modelId.trim()),
    queryFn: async ({ signal }) => {
      const combined = AbortSignal.any([signal, AbortSignal.timeout(MODEL_DETAILS_TIMEOUT_MS)])

      const [showData, tagsData] = await Promise.all([
        appWretch
          .url(`${baseUrl}/api/show`)
          .options({ signal: combined })
          .post({ model: modelId })
          .json<ShowResponse>(),
        appWretch
          .url(`${baseUrl}/api/tags`)
          .options({ signal: combined })
          .get()
          .json<TagsResponse>()
          .catch(() => ({ models: [] }) as TagsResponse),
      ])

      const normalizedModel = normalizeModelName(modelId)
      const matchedTag = (tagsData.models ?? []).find(
        (item) => Boolean(item.name) && (normalizeModelName(item.name) === normalizedModel || item.name === modelId),
      )

      return {
        capabilities: showData.capabilities ?? [],
        contextLength: getContextLength(showData),
        family: showData.details?.family,
        modifiedAt: matchedTag?.modified_at,
        parameterSize: showData.details?.parameter_size,
        quantizationLevel: showData.details?.quantization_level,
        sizeBytes: matchedTag?.size,
      } satisfies RuntimeModelDetails
    },
    queryKey: ollamaKeys.modelDetails(baseUrl, modelId),
    retry: false,
    staleTime: 60_000,
  })

/** Guard model installation check — retryCount in the key forces a fresh check on retry. */
export const guardCheckOptions = (baseUrl: string, retryCount: number) =>
  queryOptions({
    queryFn: async ({ signal }) => {
      const data = await appWretch
        .url(`${baseUrl}/api/tags`)
        .options({ signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) })
        .get()
        .json<{ models?: { name: string }[] }>()
      return (data.models ?? []).some((model) => normalizeModelName(model.name) === DEFAULT_GUARD_MODEL)
    },
    queryKey: guardKeys.check(baseUrl, retryCount),
    retry: 0,
    staleTime: Infinity,
  })

// ── Mutation hooks ─────────────────────────────────────────────────────────────

const PERCENT_BASE = 100

/**
 * Streaming model pull with per-model progress tracking.
 * On success, automatically invalidates ollamaKeys.tags and ollamaKeys.health
 * so installed-models lists and health badges refresh without manual wiring.
 */
export function useModelPullMutation() {
  const queryClient = useQueryClient()
  const [pullStates, setPullStates] = useState<Record<string, PullState>>({})
  const pullAborts = useRef<Record<string, AbortController>>({})

  useEffect(
    () => () => {
      for (const abort of Object.values(pullAborts.current)) {
        abort.abort()
      }
    },
    [],
  )

  function formatProgress(event: PullEvent): string {
    const hasProgress = typeof event.completed === 'number' && typeof event.total === 'number' && event.total > 0
    return hasProgress
      ? `${Math.round((event.completed! / event.total!) * PERCENT_BASE)}%`
      : (event.status ?? 'Pulling…')
  }

  function handlePull(modelId: string, baseUrl: string): void {
    pullAborts.current[modelId]?.abort()

    const abort = new AbortController()
    pullAborts.current[modelId] = abort
    setPullStates((prev) => ({ ...prev, [modelId]: { status: 'pulling' } }))
    notify.info('Pull started', {
      action: { label: 'Cancel', onClick: () => pullAborts.current[modelId]?.abort() },
      description: modelId,
    })

    streamModelPull(baseUrl, modelId, abort.signal, (event) => {
      setPullStates((prev) => ({ ...prev, [modelId]: { progress: formatProgress(event), status: 'pulling' } }))
    })
      .then((result) => {
        if (result.type === 'success') {
          notify.success('Model pull completed', {
            action: { label: 'Copy model', onClick: () => void copyNotificationDetails(modelId, 'Model id copied') },
            description: modelId,
          })
          setPullStates((prev) => ({ ...prev, [modelId]: { status: 'done' } }))
          void queryClient.invalidateQueries({ queryKey: ollamaKeys.tags(baseUrl) })
          void queryClient.invalidateQueries({ queryKey: ollamaKeys.health(baseUrl) })
        } else if (result.type === 'error') {
          notify.error(`Pull failed: ${modelId}`, {
            action: { label: 'Retry', onClick: () => handlePull(modelId, baseUrl) },
            description: result.message,
          })
          setPullStates((prev) => ({ ...prev, [modelId]: { error: result.message, status: 'error' } }))
        } else {
          notify.warning('Pull ended without final status', {
            action: { label: 'Retry', onClick: () => handlePull(modelId, baseUrl) },
            description: modelId,
          })
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          notify.info('Pull canceled', { description: modelId })
          return
        }
        notify.error(`Pull failed: ${modelId}`, {
          action: { label: 'Retry', onClick: () => handlePull(modelId, baseUrl) },
          description: 'Connection failed. Is Ollama running?',
        })
        setPullStates((prev) => ({ ...prev, [modelId]: { error: 'Connection failed', status: 'error' } }))
      })
  }

  return { handlePull, pullStates }
}
