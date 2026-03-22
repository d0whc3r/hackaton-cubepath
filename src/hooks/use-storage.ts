import { useCallback, useEffect, useState } from 'react'

import type { AttemptResult } from '@/lib/utils/attempt'
import type { StorageType } from '@/lib/utils/storage'

import { readStorage, removeStorage, writeStorage } from '@/lib/utils/storage'

export function useStorage<T>(
  key: string,
  options?: { storage?: StorageType; defaultValue?: T },
): {
  value: T | null
  error: unknown | null
  set: (value: T) => AttemptResult<void>
  remove: () => AttemptResult<void>
} {
  const defaultValue = options?.defaultValue ?? null
  const storageType = options?.storage

  const [value, setValue] = useState<T | null>(defaultValue as T | null)
  const [error, setError] = useState<unknown | null>(null)

  // Post-hydration read
  useEffect(() => {
    const result = readStorage<T>(key, { defaultValue: options?.defaultValue, storage: storageType })
    if (result.ok) {
      setValue(result.value)
      setError(null)
    } else {
      setValue(defaultValue as T | null)
      setError(result.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, storageType])

  // Cross-tab sync
  useEffect(() => {
    function handleStorageEvent(event: StorageEvent) {
      if (event.key !== key) {
        return
      }

      if (event.newValue === null) {
        setValue(defaultValue as T | null)
        setError(null)
        return
      }

      try {
        const parsed = JSON.parse(event.newValue) as T
        setValue(parsed)
        setError(null)
      } catch (error) {
        setError(error)
      }
    }

    globalThis.addEventListener('storage', handleStorageEvent)
    return () => globalThis.removeEventListener('storage', handleStorageEvent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, defaultValue])

  const set = useCallback(
    (newValue: T): AttemptResult<void> => {
      const result = writeStorage<T>(key, newValue, { storage: storageType })
      if (result.ok) {
        setValue(newValue)
        setError(null)
      } else {
        setError(result.error)
      }
      return result
    },
    [key, storageType],
  )

  const remove = useCallback((): AttemptResult<void> => {
    const result = removeStorage(key, { storage: storageType })
    if (result.ok) {
      setValue(defaultValue as T | null)
      setError(null)
    } else {
      setError(result.error)
    }
    return result
  }, [key, storageType, defaultValue])

  return { error, remove, set, value }
}
