import type { AttemptResult } from '@/lib/utils/attempt'
import { attempt } from '@/lib/utils/attempt'

export type StorageType = 'local' | 'session'

function getStorage(type: StorageType = 'local'): Storage | null {
  if (globalThis.window === undefined) {
    return null
  }
  return type === 'session' ? globalThis.sessionStorage : globalThis.localStorage
}

export function readStorage<T>(
  key: string,
  options?: { storage?: StorageType; defaultValue?: T },
): AttemptResult<T | null> {
  const store = getStorage(options?.storage)
  if (store === null) {
    return { ok: true, value: options?.defaultValue ?? null }
  }

  const getResult = attempt(() => store.getItem(key))
  if (!getResult.ok) {
    return getResult
  }

  const rawValue = getResult.value
  if (rawValue === null) {
    return { ok: true, value: options?.defaultValue ?? null }
  }

  const parseResult = attempt(() => JSON.parse(rawValue) as T)
  if (!parseResult.ok) {
    return parseResult
  }

  return { ok: true, value: parseResult.value }
}

export function writeStorage<T>(key: string, value: T, options?: { storage?: StorageType }): AttemptResult<void> {
  const store = getStorage(options?.storage)
  if (store === null) {
    return { error: new Error('Storage unavailable'), ok: false }
  }
  return attempt(() => store.setItem(key, JSON.stringify(value)))
}

export function removeStorage(key: string, options?: { storage?: StorageType }): AttemptResult<void> {
  const store = getStorage(options?.storage)
  if (store === null) {
    return { error: new Error('Storage unavailable'), ok: false }
  }
  return attempt(() => store.removeItem(key))
}
