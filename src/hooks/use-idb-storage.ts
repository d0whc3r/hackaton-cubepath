import { useCallback, useEffect, useMemo, useState } from 'react'
import type { StorageCategory } from '@/lib/storage/engine'
import { getStorageEngine } from '@/lib/storage/engine'

/**
 * React hook for persistent async storage.
 * Transparently uses IndexedDB (for 'history') or localStorage/sessionStorage
 * depending on the category — the caller never needs to know which backend is active.
 *
 * @example
 * const { value, loading, set, remove } = useIDBStorage<MyType[]>('my-key', 'history', [])
 */
export function useIDBStorage<T>(
  key: string,
  category: StorageCategory,
  defaultValue?: T,
): {
  value: T | null
  loading: boolean
  error: Error | null
  set: (value: T) => Promise<void>
  remove: () => Promise<void>
} {
  const engine = useMemo(() => getStorageEngine(category), [category])

  const [value, setValue] = useState<T | null>(defaultValue ?? null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    engine
      .read<T>(key)
      .then((result) => {
        if (!cancelled) {
          setValue(result ?? defaultValue ?? null)
          setLoading(false)
        }
      })
      .catch((catchError: unknown) => {
        if (!cancelled) {
          setError(catchError instanceof Error ? catchError : new Error(String(catchError)))
          setValue(defaultValue ?? null)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, category])

  const set = useCallback(
    async (newValue: T): Promise<void> => {
      try {
        await engine.write(key, newValue)
        setValue(newValue)
        setError(null)
      } catch (catchError) {
        setError(catchError instanceof Error ? catchError : new Error(String(catchError)))
      }
    },
    [key, engine],
  )

  const remove = useCallback(async (): Promise<void> => {
    try {
      await engine.remove(key)
      setValue(defaultValue ?? null)
      setError(null)
    } catch (catchError) {
      setError(catchError instanceof Error ? catchError : new Error(String(catchError)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, engine])

  return { error, loading, remove, set, value }
}
