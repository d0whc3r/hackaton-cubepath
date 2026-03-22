# API Contract: Storage Utilities & Hook

**Branch**: `003-storage-hook-attempt` | **Date**: 2026-03-22

---

## Module: `src/lib/utils/attempt.ts`

### Export: `AttemptResult<T>`

```typescript
export type AttemptResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: unknown }
```

### Export: `attempt` (function, overloaded)

```typescript
// Synchronous — no fallback
export function attempt<T>(fn: () => T): AttemptResult<T>

// Synchronous — with fallback (value or function)
export function attempt<T>(fn: () => T, fallback: T | (() => T)): AttemptResult<T>

// Asynchronous — no fallback
export function attempt<T>(fn: () => Promise<T>): Promise<AttemptResult<T>>

// Asynchronous — with fallback (value or async/sync function)
export function attempt<T>(fn: () => Promise<T>, fallback: T | (() => T | Promise<T>)): Promise<AttemptResult<T>>
```

**Behavior**:
- Calls `fn()` inside a try/catch.
- On success: returns `{ ok: true, value: result }`.
- On thrown exception **with no fallback**: returns `{ ok: false, error: caughtValue }`.
- On thrown exception **with fallback provided**:
  - If `fallback` is a plain value: returns `{ ok: true, value: fallback }`.
  - If `fallback` is a function: calls it inside a try/catch.
    - If fallback succeeds: returns `{ ok: true, value: fallbackResult }`.
    - If fallback also throws: returns `{ ok: false, error: originalError }` (original error preserved).
- If `fn()` returns a Promise, the async overload is used: the promise is awaited and rejection is caught.
- Never throws. Never returns a rejected promise.

**Usage examples**:

```typescript
// Sync — no fallback
const result = attempt(() => JSON.parse(rawString))
if (result.ok) console.log(result.value)
else console.error(result.error)

// Sync — with value fallback (always succeeds)
const result = attempt(() => JSON.parse(rawString), [])
// result is always { ok: true, value: parsedOrEmptyArray }

// Sync — with function fallback
const result = attempt(() => JSON.parse(rawString), () => computeDefault())
// if JSON.parse fails, computeDefault() is tried next

// Async — no fallback
const result = await attempt(() => fetch('/api/data').then(r => r.json()))
if (!result.ok) handleError(result.error)

// Async — with value fallback
const result = await attempt(() => fetch('/api').then(r => r.json()), null)
// on network failure: { ok: true, value: null }
```

---

## Module: `src/lib/utils/storage.ts`

### Export: `StorageType`

```typescript
export type StorageType = 'local' | 'session'
```

### Export: `readStorage<T>`

```typescript
export function readStorage<T>(
  key: string,
  options?: {
    storage?: StorageType   // default: 'local'
    defaultValue?: T        // returned when key absent or parse fails
  }
): AttemptResult<T | null>
```

**Behavior**:
- Returns `{ ok: false, error }` immediately if storage is unavailable (SSR / private mode restriction).
- Retrieves the raw string, then attempts `JSON.parse`.
- If key is absent: returns `{ ok: true, value: defaultValue ?? null }`.
- If parse succeeds: returns `{ ok: true, value: parsedValue }`.
- If parse fails: returns `{ ok: false, error: parseError }`.

### Export: `writeStorage<T>`

```typescript
export function writeStorage<T>(
  key: string,
  value: T,
  options?: { storage?: StorageType }  // default: 'local'
): AttemptResult<void>
```

**Behavior**:
- Returns `{ ok: false, error }` immediately if storage is unavailable.
- Serializes `value` via `JSON.stringify`, then calls `storage.setItem`.
- If serialization or `setItem` throws (e.g., `QuotaExceededError`): returns `{ ok: false, error }`.
- On success: returns `{ ok: true, value: undefined }`.

### Export: `removeStorage`

```typescript
export function removeStorage(
  key: string,
  options?: { storage?: StorageType }  // default: 'local'
): AttemptResult<void>
```

**Behavior**:
- Returns `{ ok: false, error }` immediately if storage is unavailable.
- Calls `storage.removeItem(key)`. Never throws even if key doesn't exist.
- On success: returns `{ ok: true, value: undefined }`.

---

## Module: `src/hooks/use-storage.ts`

### Export: `useStorage<T>`

```typescript
export function useStorage<T>(
  key: string,
  options?: {
    storage?: StorageType   // default: 'local'
    defaultValue?: T        // initial value before hydration and on missing/failed reads
  }
): {
  value: T | null
  error: unknown | null
  set: (value: T) => AttemptResult<void>
  remove: () => AttemptResult<void>
}
```

**Behavior**:

| Scenario | `value` | `error` |
|----------|---------|---------|
| Before hydration / SSR | `defaultValue ?? null` | `null` |
| After hydration, key present and valid | parsed value | `null` |
| After hydration, key absent | `defaultValue ?? null` | `null` |
| After hydration, key unparseable | `defaultValue ?? null` | parse error |
| Storage unavailable (SSR, restricted) | `defaultValue ?? null` | storage error |
| `set(v)` succeeds | updated to `v` | `null` |
| `set(v)` fails (e.g., quota) | unchanged | write error |
| `remove()` succeeds | `defaultValue ?? null` | `null` |
| `remove()` fails | unchanged | removal error |
| Cross-tab write (storage event) | updated to new value | `null` (or parse error) |
| Cross-tab removal (storage event) | `defaultValue ?? null` | `null` |

**Invariants**:
- `set` and `remove` update React state synchronously on success, so the component re-renders with the new value immediately (no double-render / flash).
- The `storage` event listener is attached on mount and cleaned up on unmount.
- `key` and `options.storage` changes cause the hook to re-read from storage and re-subscribe.
- `set` and `remove` are stable references (wrapped with `useCallback`).
