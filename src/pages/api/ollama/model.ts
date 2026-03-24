import type { APIRoute } from 'astro'
import { ollamaWretch } from '@/lib/http/ollama-client'
import { withApiLogging } from '@/lib/observability/api'
import { logServer, logServerError } from '@/lib/observability/server'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'

const OLLAMA_TIMEOUT_MS = 5000

interface ShowResponse {
  capabilities?: string[]
  details?: {
    family?: string
    parameter_size?: string
    quantization_level?: string
  }
  model_info?: Record<string, unknown>
  parameters?: string
}

interface TagsResponse {
  models?: {
    modified_at?: string
    name?: string
    size?: number
  }[]
}

function normalizeModelName(name: string): string {
  const [base, tag] = name.split(':')
  return tag && tag !== 'latest' ? `${base}:${tag}` : (base ?? name)
}

function getContextLength(data: ShowResponse): number | undefined {
  const modelInfo = data.model_info ?? {}
  for (const [key, value] of Object.entries(modelInfo)) {
    if (key.endsWith('.context_length') && typeof value === 'number') {
      return value
    }
  }

  const parameters = data.parameters ?? ''
  const match = parameters.match(/num_ctx\s+(\d+)/)
  if (!match) {
    return undefined
  }
  return Number(match[1])
}

export const GET: APIRoute = withApiLogging('ollama.model', async ({ url }, requestId) => {
  const baseUrl = url.searchParams.get('baseUrl') ?? OLLAMA_BASE_URL_DEFAULT
  const model = url.searchParams.get('model')

  if (!model) {
    logServer('warn', 'ollama.model.missing_model', { requestId })
    return Response.json({ error: 'model is required' }, { status: 400 })
  }

  try {
    // WretchError thrown on non-OK is caught by the outer catch block below,
    // Which returns the same fallback response as before.
    const [showData, tagsData] = await Promise.all([
      ollamaWretch
        .url(`${baseUrl}/api/show`)
        .options({
          headers: { 'x-request-id': requestId },
          signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
        })
        .post({ model })
        .json<ShowResponse>(),
      ollamaWretch
        .url(`${baseUrl}/api/tags`)
        .options({
          headers: { 'x-request-id': requestId },
          signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
        })
        .get()
        .json<TagsResponse>()
        .catch(() => ({ models: [] }) as TagsResponse),
    ])

    const normalizedModel = normalizeModelName(model)
    const matchedTag = (tagsData.models ?? []).find((item) => {
      if (!item.name) {
        return false
      }
      return normalizeModelName(item.name) === normalizedModel || item.name === model
    })

    return Response.json(
      {
        details: {
          capabilities: showData.capabilities ?? [],
          contextLength: getContextLength(showData),
          family: showData.details?.family,
          modifiedAt: matchedTag?.modified_at,
          parameterSize: showData.details?.parameter_size,
          quantizationLevel: showData.details?.quantization_level,
          sizeBytes: matchedTag?.size,
        },
        model,
      },
      { status: 200 },
    )
  } catch (error) {
    logServerError('ollama.model.fetch_failed', error, {
      baseUrl,
      model,
      requestId,
    })
    // WretchError from show request (e.g. model not found) → return null details
    return Response.json({ details: null, model }, { status: 200 })
  }
})
