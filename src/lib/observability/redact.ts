import type { LogLayerPlugin } from 'loglayer'

/**
 * Redaction plugin for LogLayer that censors sensitive fields by dot-path.
 * Does NOT use eval / new Function, making it compatible with Cloudflare Workers.
 */
export function redactionPlugin(opts: { censor: string; paths: string[]; id?: string }): LogLayerPlugin {
  const parsed = opts.paths.map((path) => path.split('.'))

  function redactIn(obj: Record<string, unknown>, parts: string[]): void {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return
    }
    const [head, ...tail] = parts
    if (head === undefined) {
      return
    }
    if (tail.length === 0) {
      if (Object.hasOwn(obj, head)) {
        obj[head] = opts.censor
      }
    } else {
      redactIn(obj[head] as Record<string, unknown>, tail)
    }
  }

  return {
    id: opts.id,
    onMetadataCalled(metadata: Record<string, unknown>) {
      if (!metadata) {
        return metadata
      }
      const copy = { ...metadata }
      for (const parts of parsed) {
        redactIn(copy, parts)
      }
      return copy
    },
  }
}
