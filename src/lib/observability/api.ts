import type { APIContext, APIRoute } from 'astro'
import { REQUEST_ID_HEADER } from '@/lib/http/request-trace'
import { logServer, logServerError } from '@/lib/observability/server'

type InstrumentedApiHandler = (ctx: APIContext, requestId: string) => Promise<Response>

function levelFromStatus(status: number): 'error' | 'warn' | 'info' {
  if (status >= 500) {
    return 'error'
  }
  if (status >= 400) {
    return 'warn'
  }
  return 'info'
}

function withRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers)
  headers.set(REQUEST_ID_HEADER, requestId)
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}

export function withApiLogging(routeId: string, handler: InstrumentedApiHandler): APIRoute {
  return async (ctx) => {
    const requestId = ctx.request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID()
    const startedAt = Date.now()
    const { method } = ctx.request
    const { host, pathname: path } = ctx.url

    logServer('info', 'api.request.start', { host, method, path, requestId, routeId })

    try {
      const response = await handler(ctx, requestId)
      const durationMs = Date.now() - startedAt
      const { status } = response
      const level = levelFromStatus(status)

      logServer(level, 'api.request.end', { durationMs, host, method, path, requestId, routeId, status })

      return withRequestId(response, requestId)
    } catch (error) {
      const durationMs = Date.now() - startedAt
      logServerError('api.request.unhandled_error', error, { durationMs, host, method, path, requestId, routeId })
      return Response.json({ error: 'INTERNAL_ERROR', requestId }, { status: 500 })
    }
  }
}
