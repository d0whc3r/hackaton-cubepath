export type AttemptResult<T> = { ok: true; value: T } | { ok: false; error: unknown }

// Sync; no fallback
export function attempt<T>(fn: () => T): AttemptResult<T>
// Sync; with fallback (plain value or function)
export function attempt<T>(fn: () => T, fallback: T | (() => T)): AttemptResult<T>
// Async; no fallback
export function attempt<T>(fn: () => Promise<T>): Promise<AttemptResult<T>>
// Async; with fallback (value or sync/async function)
export function attempt<T>(fn: () => Promise<T>, fallback: T | (() => T | Promise<T>)): Promise<AttemptResult<T>>
export function attempt<T>(
  fn: () => T | Promise<T>,
  fallback?: T | (() => T | Promise<T>),
): AttemptResult<T> | Promise<AttemptResult<T>> {
  try {
    const result = fn()
    if (result instanceof Promise) {
      return result
        .then((value): AttemptResult<T> => ({ ok: true, value }))
        .catch((error: unknown): AttemptResult<T> | Promise<AttemptResult<T>> => {
          if (fallback === undefined) {
            return { error, ok: false }
          }
          return resolveAsyncFallback<T>(error, fallback)
        })
    }
    return { ok: true, value: result }
  } catch (error: unknown) {
    if (fallback === undefined) {
      return { error, ok: false }
    }
    try {
      const value = typeof fallback === 'function' ? (fallback as () => T)() : (fallback as T)
      return { ok: true, value }
    } catch {
      return { error, ok: false } // Preserve original error
    }
  }
}

async function resolveAsyncFallback<T>(
  originalError: unknown,
  fallback: T | (() => T | Promise<T>),
): Promise<AttemptResult<T>> {
  try {
    const value = typeof fallback === 'function' ? await (fallback as () => T | Promise<T>)() : (fallback as T)
    return { ok: true, value }
  } catch {
    return { error: originalError, ok: false }
  }
}
