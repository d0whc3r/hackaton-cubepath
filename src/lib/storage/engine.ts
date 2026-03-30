/**
 * Transparent storage engine.
 *
 * Usage: call `getStorageEngine(category)` to get the right backend for your data.
 *
 * Categories:
 *   'history'  — chat questions & answers → IndexedDB if available, localStorage otherwise (never both)
 *   'config'   — user settings            → localStorage (sync, small payloads)
 *   'session'  — ephemeral tab data       → sessionStorage
 *
 * The history engine is transparent: callers never know whether IDB or localStorage handled the op.
 */

import { idbGet, idbRemove, idbSet, isIndexedDBAvailable } from '@/lib/storage/idb'
import { readStorage, removeStorage, writeStorage } from '@/lib/utils/storage'

type StorageCategory = 'history' | 'settings' | 'config' | 'session'

interface StorageEngine {
  read<T>(key: string): Promise<T | null>
  remove(key: string): Promise<void>
  write<T>(key: string, value: T): Promise<void>
}

// --- localStorage / sessionStorage engine ---

function makeSyncEngine(type: 'local' | 'session'): StorageEngine {
  return {
    async read<T>(key: string): Promise<T | null> {
      const result = readStorage<T>(key, { storage: type })
      return result.ok ? (result.value ?? null) : null
    },
    async remove(key: string): Promise<void> {
      removeStorage(key, { storage: type })
    },
    async write<T>(key: string, value: T): Promise<void> {
      writeStorage(key, value, { storage: type })
    },
  }
}

// --- IndexedDB-only engine ---

function makeIDBEngine(): StorageEngine {
  return {
    async read<T>(key: string): Promise<T | null> {
      return idbGet<T>(key)
    },
    async remove(key: string): Promise<void> {
      await idbRemove(key)
    },
    async write<T>(key: string, value: T): Promise<void> {
      await idbSet(key, value)
    },
  }
}

// --- Engine singletons ---

const lsEngine = makeSyncEngine('local')
const sessionEngine = makeSyncEngine('session')
let idbEngine: StorageEngine | null = null

function getIDBEngine(): StorageEngine {
  idbEngine ??= makeIDBEngine()
  return idbEngine
}

/**
 * Returns the appropriate storage engine for the given category.
 * The caller does not need to know which backend is active.
 */
export function getStorageEngine(category: StorageCategory): StorageEngine {
  switch (category) {
    case 'config': {
      return lsEngine
    }
    case 'history':
    case 'settings': {
      return isIndexedDBAvailable() ? getIDBEngine() : lsEngine
    }
    case 'session': {
      return sessionEngine
    }
  }
}
