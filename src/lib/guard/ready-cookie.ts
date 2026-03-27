import { z } from 'zod'

const ReadyCookieSchema = z.object({
  key: z.string(),
  timestamp: z.number(),
})

export function parseReadyCookie(raw: string | undefined): { key: string; timestamp: number } | null {
  if (!raw) {
    return null
  }
  try {
    const result = ReadyCookieSchema.safeParse(JSON.parse(decodeURIComponent(raw)))
    if (!result.success) {
      return null
    }
    return result.data
  } catch {
    return null
  }
}
