import type { APIRoute } from 'astro'
import { streamText } from 'ai'
import { z } from 'zod'
import { resolveModel, resolveValue } from '@/lib/api/resolve-model'
import { createSseStream, ollamaClient, sseResponse } from '@/lib/api/sse'
import { withApiLogging } from '@/lib/observability/api'
import { logServer, logServerError } from '@/lib/observability/server'
import { DEFAULT_TRANSLATE_MODEL, OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'

const translateSchema = z.object({
  model: z.string().optional(),
  ollamaBaseUrl: z.string().optional(),
  targetLanguage: z.string().min(1).max(80),
  text: z.string().min(1).max(32_000),
})

// Code blocks are extracted client-side before this endpoint is called,
// So the prompt only needs to handle plain prose translation.
function systemPrompt(targetLanguage: string): string {
  return `You are a professional translator. Translate ALL text provided by the user into ${targetLanguage}.
Output ONLY the translated text; no explanations, disclaimers, or commentary.
Preserve every [[CODE:N]] placeholder exactly as-is (do not translate or alter them).`
}

const ABORT_TIMEOUT_MS = 120_000

export const POST: APIRoute = withApiLogging('translate.main', async ({ request }, requestId) => {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    logServer('warn', 'translate.invalid_json', { requestId })
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = translateSchema.safeParse(raw)
  if (!parsed.success) {
    logServer('warn', 'translate.validation_error', {
      message: parsed.error.issues[0]?.message,
      requestId,
    })
    return Response.json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const { text, targetLanguage, model: mBody, ollamaBaseUrl: urlBody } = parsed.data
  const baseUrl = resolveValue(urlBody, OLLAMA_BASE_URL_DEFAULT)
  const model = resolveModel(mBody, DEFAULT_TRANSLATE_MODEL)

  const stream = createSseStream(async (emit) => {
    const ollama = ollamaClient(baseUrl)
    const abort = new AbortController()
    const timeout = setTimeout(() => abort.abort(), ABORT_TIMEOUT_MS)

    try {
      const result = streamText({
        abortSignal: abort.signal,
        model: ollama(model),
        prompt: text,
        system: systemPrompt(targetLanguage),
      })

      for await (const chunk of result.textStream) {
        emit('chunk', { text: chunk })
      }

      clearTimeout(timeout)
      emit('done', {})
    } catch (error) {
      clearTimeout(timeout)
      const isAbort = error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))
      if (!isAbort) {
        logServerError('translate.stream.error', error, { model, requestId, targetLanguage })
        emit('error', { message: 'Translation model unavailable. Check Ollama is running.' })
      }
    }
  })

  logServer('info', 'translate.accepted', { model, requestId, targetLanguage })
  return sseResponse(stream)
})
