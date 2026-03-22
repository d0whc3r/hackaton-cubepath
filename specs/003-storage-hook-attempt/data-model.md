# Data Model: Centralized Storage Hook with Attempt Helper

**Branch**: `003-storage-hook-attempt` | **Date**: 2026-03-22

## Core Types

### `AttemptResult<T>`

Discriminated union representing the outcome of any fallible operation.

```
AttemptResult<T>
├── ok: true
│   └── value: T               — the successful result value
└── ok: false
    └── error: unknown          — the thrown error (type unknown; callers narrow as needed)
```

**Constraints**:
- `ok` is the discriminant — always check `result.ok` before accessing `result.value` or `result.error`
- `error` is typed `unknown` (not `Error`) because anything can be thrown in JavaScript
- The type is generic and not storage-specific — reusable for any fallible operation

---

### `Fallback<T>` (parameter type, not exported)

Optional second argument to `attempt`. Provides a recovery value or function when the primary operation fails.

```
Fallback<T> = T | (() => T) | (() => Promise<T>)
```

**Resolution rules** (when primary `fn` throws or rejects):

| Fallback type | Behavior |
|--------------|---------|
| Plain value `T` | Return `{ ok: true, value: fallback }` — always recovers |
| Sync function `() => T` | Call it; if it succeeds → `{ ok: true, value: result }`; if it throws → `{ ok: false, error: originalError }` |
| Async function `() => Promise<T>` | Await it; same success/failure logic as sync function |
| Not provided | Return `{ ok: false, error: caughtError }` (original behavior) |

**Key invariant**: When a fallback function also fails, the **original error** is preserved in the result — not the fallback's error. This makes debugging easier: callers always see why the primary operation failed.

---

### `StorageType`

Union literal selecting which Web Storage backend to use.

```
StorageType = 'local' | 'session'
```

**Default**: `'local'` (localStorage)

---

### Storage Utility Function Signatures

**`readStorage<T>(key, options?) → AttemptResult<T | null>`**

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Storage key |
| `options.storage` | `StorageType` (optional) | Which storage to use; defaults to `'local'` |
| `options.defaultValue` | `T` (optional) | Returned when key is absent or value cannot be parsed |
| **returns** | `AttemptResult<T \| null>` | Success with parsed value (or default/null), or failure with captured error |

**`writeStorage<T>(key, value, options?) → AttemptResult<void>`**

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Storage key |
| `value` | `T` | Value to serialize and store |
| `options.storage` | `StorageType` (optional) | Which storage to use; defaults to `'local'` |
| **returns** | `AttemptResult<void>` | Success or failure (e.g., quota exceeded) |

**`removeStorage(key, options?) → AttemptResult<void>`**

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Storage key to remove |
| `options.storage` | `StorageType` (optional) | Which storage to use; defaults to `'local'` |
| **returns** | `AttemptResult<void>` | Success or failure (storage unavailable) |

---

### `UseStorageResult<T>` — hook return shape

```
UseStorageResult<T>
├── value: T | null             — current value; null if absent, unparseable, or SSR
├── error: unknown | null       — last captured error; null when no error
├── set(value: T): AttemptResult<void>  — write new value; updates state immediately
└── remove(): AttemptResult<void>       — remove key; resets value to defaultValue or null
```

**State lifecycle**:
```
mount (SSR / pre-hydration)
  └─ value = defaultValue ?? null, error = null

useEffect (after hydration)
  ├─ readStorage succeeds → value = parsed result, error = null
  └─ readStorage fails   → value = defaultValue ?? null, error = captured

storage event (cross-tab write)
  ├─ newValue present  → parse → update value (or set error on parse failure)
  └─ newValue null     → value = defaultValue ?? null

set(v) called
  ├─ writeStorage succeeds → value = v, error = null
  └─ writeStorage fails    → error = captured (value unchanged)

remove() called
  ├─ removeStorage succeeds → value = defaultValue ?? null, error = null
  └─ removeStorage fails    → error = captured (value unchanged)
```

---

## Existing Storage Keys (unchanged)

| Key | Module | Type | Default |
|-----|--------|------|---------|
| `slm-router-model-config` | `model-config.ts` | `ModelConfig` | `DEFAULTS` |
| `slm-router-history-{taskType}` | `history.ts` | `ConversationEntry[]` | `[]` |
| `slm-router-savings` | `savings.ts` | `SavingsData` | `EMPTY` |
| `theme` | `ThemeToggle.tsx` | `'light' \| 'dark'` | `'light'` |
| `sidebar-width` | `sidebar.tsx` | `number` (px) | `256` |

No storage key names are changed by this feature.

---

## Serialization Rules

- All values are serialized via `JSON.stringify` on write and deserialized via `JSON.parse` on read.
- If `JSON.parse` throws (malformed data), `readStorage` returns `{ ok: false, error }` and the calling utility/hook returns `defaultValue ?? null`.
- Non-serializable values (functions, `undefined`, circular refs) will cause a `writeStorage` failure captured by `attempt`.
- Plain strings are valid JSON (e.g., `"light"` theme value) and are handled correctly.
