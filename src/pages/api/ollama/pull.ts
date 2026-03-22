import type { APIRoute } from 'astro'

import { z } from 'zod'

import { ollamaWretch } from '@/lib/http/ollama-client'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'

const PULL_TIMEOUT_MS = 600_000

const bodySchema = z.object({
  baseUrl: z.string().optional(),
  model: z.string().min(1),
})

export const POST: APIRoute = async ({ request }) => {
  let raw
  try {
    raw = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json({ error: 'model is required' }, { status: 400 })
  }

  const { model, baseUrl = OLLAMA_BASE_URL_DEFAULT } = parsed.data

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const emit = (data: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

      try {
        const ollamaRes = await ollamaWretch
          .url(`${baseUrl}/api/pull`)
          .options({ signal: AbortSignal.timeout(PULL_TIMEOUT_MS) }) // 10 min for large models
          .post({ name: model, stream: true })
          .res()

        if (!ollamaRes.ok || !ollamaRes.body) {
          emit({ error: `Ollama responded with ${ollamaRes.status}`, status: 'error' })
          controller.close()
          return
        }

        const reader = ollamaRes.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.trim()) {
              continue
            }
            try {
              const json = JSON.parse(line) as Record<string, unknown>
              emit(json)
              if (json.status === 'success') {
                controller.close()
                return
              }
            } catch {
              /* Ignore malformed line */
            }
          }
        }
        emit({ status: 'success' })
      } catch (error) {
        emit({ error: error instanceof Error ? error.message : 'Pull failed', status: 'error' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
    },
  })
}
