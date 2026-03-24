export const REQUEST_ID_HEADER = 'x-request-id'

export function toMethod(options?: RequestInit): string {
  return options?.method?.toUpperCase() ?? 'GET'
}

export function readHeaderValue(headers: HeadersInit | undefined, key: string): string | undefined {
  if (!headers) {
    return undefined
  }

  if (headers instanceof Headers) {
    return headers.get(key) ?? undefined
  }

  if (Array.isArray(headers)) {
    const found = headers.find(([name]) => name.toLowerCase() === key.toLowerCase())
    return found?.[1]
  }

  const record = headers as Record<string, string>
  for (const [name, value] of Object.entries(record)) {
    if (name.toLowerCase() === key.toLowerCase()) {
      return value
    }
  }
  return undefined
}

export function withRequestIdHeader(options: RequestInit, requestId: string): RequestInit {
  const current = options.headers

  if (current instanceof Headers) {
    const headers = new Headers(current)
    headers.set(REQUEST_ID_HEADER, requestId)
    return { ...options, headers }
  }

  if (Array.isArray(current)) {
    const withoutRequestId = current.filter(([name]) => name.toLowerCase() !== REQUEST_ID_HEADER)
    return { ...options, headers: [...withoutRequestId, [REQUEST_ID_HEADER, requestId]] }
  }

  return {
    ...options,
    headers: {
      ...(current as Record<string, string> | undefined),
      [REQUEST_ID_HEADER]: requestId,
    },
  }
}
