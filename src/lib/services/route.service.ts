import type { MutationOptions } from '@tanstack/react-query'
import type { RouteRequest } from '@/lib/schemas/route'
import type { SSECallbacks } from '@/lib/utils/sse'
import { appWretch } from '@/lib/http/app-client'
import { parseSSEStream } from '@/lib/utils/sse'

export interface RouteStreamParams extends RouteRequest {
  signal: AbortSignal
  callbacks: SSECallbacks
}

export class BlockedError extends Error {
  constructor(public readonly blockReason: string) {
    super('Input blocked by security policy.')
    this.name = 'BlockedError'
  }
}

export function buildRouteMutationOptions(): MutationOptions<void, Error, RouteStreamParams> {
  return {
    mutationFn: async ({ signal, callbacks, ...body }: RouteStreamParams) => {
      const res = await appWretch
        .url('/api/route')
        .options({ signal })
        .post(body)
        .badRequest(async (err) => {
          const json = (await err.response?.json().catch(() => ({}))) as {
            blockReason?: string
            error?: string
            message?: string
          }
          if (json?.error === 'BLOCKED_BY_SECURITY_POLICY') {
            throw new BlockedError(json.blockReason ?? 'The request does not appear to match the selected task type.')
          }
          throw new Error(json?.message ?? 'Bad request')
        })
        .res()

      if (!res.body) {
        throw new Error('No response body received')
      }

      await parseSSEStream(res.body.getReader(), callbacks)
    },
    mutationKey: ['route'],
  }
}
