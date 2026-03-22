import type { APIRoute } from 'astro'

import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'

interface OllamaTagsResponse {
  models: { name: string }[]
}

export const GET: APIRoute = async ({ url }) => {
  const baseUrl = url.searchParams.get('baseUrl') ?? OLLAMA_BASE_URL_DEFAULT

  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) {
      return Response.json({ error: 'Ollama unreachable', models: [] }, { status: 200 })
    }
    const data = (await res.json()) as OllamaTagsResponse
    const names = (data.models ?? []).map((m) => {
      // Normalize: "phi3.5:latest" → "phi3.5", keep tag if not "latest"
      const [base, tag] = m.name.split(':')
      return tag && tag !== 'latest' ? `${base}:${tag}` : (base ?? m.name)
    })
    return Response.json({ models: names }, { status: 200 })
  } catch {
    return Response.json({ error: 'Ollama unreachable', models: [] }, { status: 200 })
  }
}
