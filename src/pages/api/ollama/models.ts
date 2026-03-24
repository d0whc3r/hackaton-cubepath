import type { APIRoute } from 'astro'
import { ollamaWretch } from '@/lib/http/ollama-client'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'

const OLLAMA_TIMEOUT_MS = 5000

interface OllamaTagsResponse {
  models: { name: string }[]
}

export const GET: APIRoute = async ({ url }) => {
  const baseUrl = url.searchParams.get('baseUrl') ?? OLLAMA_BASE_URL_DEFAULT

  try {
    // WretchError thrown on non-OK is caught by the outer catch block below,
    // Which returns the same fallback response as before.
    const data = await ollamaWretch
      .url(`${baseUrl}/api/tags`)
      .options({ signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS) })
      .get()
      .json<OllamaTagsResponse>()
    const names = (data.models ?? []).map((model) => {
      // Normalize: "phi3.5:latest" → "phi3.5", keep tag if not "latest"
      const [base, tag] = model.name.split(':')
      return tag && tag !== 'latest' ? `${base}:${tag}` : (base ?? model.name)
    })
    return Response.json({ models: names }, { status: 200 })
  } catch {
    return Response.json({ error: 'Ollama unreachable', models: [] }, { status: 200 })
  }
}
