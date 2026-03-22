import { useCallback, useEffect, useState } from 'react'

import type { AttemptResult } from '@/lib/utils/attempt'
import type { StorageType } from '@/lib/utils/storage'

import { readStorage, removeStorage, writeStorage } from '@/lib/utils/storage'

export function useStorage<T>(
  key: string,
  options?: { storage?: StorageType; defaultValue?: T },
): {
  value: T | null
  error: Error | null
  set: (value: T) => AttemptResult<void>
  remove: () => AttemptResult<void>
} {
  const defaultValue = options?.defaultValue ?? null
  const storageType = options?.storage

  const [value, setValue] = useState<T | null>(defaultValue as T | null)
  const [storageError, setStorageError] = useState<Error | null>(null)

  // Post-hydration read
  useEffect(() => {
    const result = readStorage<T>(key, { defaultValue: options?.defaultValue, storage: storageType })
    if (result.ok) {
      setValue(result.value)
      setStorageError(null)
    } else {
      setValue(defaultValue as T | null)
      if (result.error instanceof Error) {
        setStorageError(result.error)
      } else {
        setStorageError(new Error('Unknown error'))
      }
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
        setStorageError(null)
        return
      }

      try {
        const parsed = JSON.parse(event.newValue) as T
        setValue(parsed)
        setStorageError(null)
      } catch (error) {
        if (error instanceof Error) {
          setStorageError(error)
        } else {
          setStorageError(new Error('Unknown error'))
        }
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
        setStorageError(null)
      } else if (result.error instanceof Error) {
        setStorageError(result.error)
      } else {
        setStorageError(new Error('Unknown error'))
      }
      return result
    },
    [key, storageType],
  )

  const remove = useCallback((): AttemptResult<void> => {
    const result = removeStorage(key, { storage: storageType })
    if (result.ok) {
      setValue(defaultValue as T | null)
      setStorageError(null)
    } else if (result.error instanceof Error) {
      setStorageError(result.error)
    } else {
      setStorageError(new Error('Unknown error'))
    }
    return result
  }, [key, storageType, defaultValue])

  return { error: storageError, remove, set, value }
}
