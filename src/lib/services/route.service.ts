import type { MutationOptions } from '@tanstack/react-query'

import type { RouteRequest } from '@/lib/schemas/route'
import type { SSECallbacks } from '@/lib/utils/sse'

import { parseSSEStream } from '@/lib/utils/sse'

export interface RouteStreamParams extends RouteRequest {
  signal: AbortSignal
  callbacks: SSECallbacks
}

export function buildRouteMutationOptions(): MutationOptions<void, Error, RouteStreamParams> {
  return {
    mutationFn: async ({ signal, callbacks, ...body }: RouteStreamParams) => {
      const res = await fetch('/api/route', {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal,
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(json.message ?? `Request failed with status ${res.status}`)
      }

      if (!res.body) {
        throw new Error('No response body received')
      }

      await parseSSEStream(res.body.getReader(), callbacks)
    },
    mutationKey: ['route'],
  }
}
