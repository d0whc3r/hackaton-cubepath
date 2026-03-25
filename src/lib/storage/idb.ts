/**
 * Low-level IndexedDB utilities.
 * Single database, single key-value object store — mirrors the localStorage API shape.
 */

const DB_NAME = 'slm-router-db'
const DB_VERSION = 1
const STORE_NAME = 'kv'

let dbPromise: Promise<IDBDatabase> | null = null

export function isIndexedDBAvailable(): boolean {
  return typeof globalThis !== 'undefined' && globalThis.indexedDB !== undefined
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    // oxlint-disable-next-line unicorn/prefer-add-event-listener
    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
  })

  return dbPromise
}

export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDB()
  return new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(key)
    request.onsuccess = () => resolve((request.result as T) ?? null)
    // oxlint-disable-next-line unicorn/prefer-add-event-listener
    request.onerror = () => reject(request.error)
  })
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(value, key)
    request.onsuccess = () => resolve()
    // oxlint-disable-next-line unicorn/prefer-add-event-listener
    request.onerror = () => reject(request.error)
  })
}

export async function idbRemove(key: string): Promise<void> {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(key)
    request.onsuccess = () => resolve()
    // oxlint-disable-next-line unicorn/prefer-add-event-listener
    request.onerror = () => reject(request.error)
  })
}
