import type { APIRoute } from 'astro'
import { ollamaWretch } from '@/lib/http/ollama-client'
import { withApiLogging } from '@/lib/observability/api'
import { logServerError } from '@/lib/observability/server'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'

const TIMEOUT_MS = 5000

interface OllamaVersionResponse {
  version: string
}

interface OllamaTagsResponse {
  models: { name: string }[]
}

export interface OllamaHealthResponse {
  ollamaReachable: boolean
  ollamaVersion: string | null
  installedModels: string[]
  checkedAt: string
}

export const GET: APIRoute = withApiLogging('ollama.health', async ({ url }, requestId) => {
  const baseUrl = url.searchParams.get('baseUrl') ?? OLLAMA_BASE_URL_DEFAULT
  const headers = { 'x-request-id': requestId }

  try {
    const signal = AbortSignal.timeout(TIMEOUT_MS)
    const [versionData, tagsData] = await Promise.all([
      ollamaWretch.url(`${baseUrl}/api/version`).options({ headers, signal }).get().json<OllamaVersionResponse>(),
      ollamaWretch.url(`${baseUrl}/api/tags`).options({ headers, signal }).get().json<OllamaTagsResponse>(),
    ])

    const installedModels = (tagsData.models ?? []).map((model) => {
      const [base, tag] = model.name.split(':')
      return tag && tag !== 'latest' ? `${base}:${tag}` : (base ?? model.name)
    })

    return Response.json({
      checkedAt: new Date().toISOString(),
      installedModels,
      ollamaReachable: true,
      ollamaVersion: versionData.version ?? null,
    } satisfies OllamaHealthResponse)
  } catch (error) {
    logServerError('ollama.health.fetch_failed', error, { baseUrl, requestId })
    return Response.json({
      checkedAt: new Date().toISOString(),
      installedModels: [],
      ollamaReachable: false,
      ollamaVersion: null,
    } satisfies OllamaHealthResponse)
  }
})
