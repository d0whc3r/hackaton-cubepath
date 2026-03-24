import type { APIRoute } from 'astro'
import { z } from 'zod'
import { withApiLogging } from '@/lib/observability/api'
import { logServer } from '@/lib/observability/server'

const logSchema = z.object({
  context: z.record(z.string(), z.unknown()).optional(),
  level: z.enum(['debug', 'error', 'info', 'warn']),
  message: z.string().min(1).max(2000),
  source: z.literal('client'),
  timestamp: z.string(),
})

export const POST: APIRoute = withApiLogging('telemetry.log', async ({ request }) => {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = logSchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const { context, level, message, timestamp } = parsed.data
  logServer(level, `client.${message}`, {
    ...context,
    clientTimestamp: timestamp,
    forwardedFrom: 'browser',
  })

  return Response.json({ ok: true }, { status: 202 })
})
