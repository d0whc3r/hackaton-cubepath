# Quickstart: Centralized Storage Hook with Attempt Helper

**Branch**: `003-storage-hook-attempt` | **Date**: 2026-03-22

## What's being built

Three new modules replace all direct `localStorage`/`sessionStorage` calls in the codebase:

1. **`attempt` helper** — general-purpose try/catch wrapper returning `{ ok, value/error }`
2. **Storage utilities** — plain functions for read/write/delete (usable in any `.ts` file)
3. **`useStorage` hook** — React hook with reactivity, hydration safety, and error state

---

## New file structure

```
src/
├── lib/
│   └── utils/
│       ├── attempt.ts          ← NEW: general-purpose try/catch helper
│       └── storage.ts          ← NEW: readStorage / writeStorage / removeStorage
└── hooks/
    └── use-storage.ts          ← NEW: React hook wrapping the storage utilities

src/__tests__/
├── lib/utils/
│   ├── attempt.test.ts         ← NEW
│   └── storage.test.ts         ← NEW
└── hooks/
    └── use-storage.test.ts     ← NEW
```

---

## Migration pattern

### Before (direct localStorage)

```typescript
// Scattered try/catch, no consistent error handling
try {
  localStorage.setItem(KEY, JSON.stringify(value))
} catch {
  /* silently ignored */
}
```

### After (utility layer — non-React files)

```typescript
import { writeStorage } from '@/lib/utils/storage'

const result = writeStorage(KEY, value)
if (!result.ok) {
  // optionally handle; or ignore to match previous silent behavior
}
```

### After (hook — React components)

```typescript
import { useStorage } from '@/hooks/use-storage'

const { value, error, set, remove } = useStorage<MyType>(KEY, { defaultValue: INITIAL })

// value is always T | null — never throws
// error is non-null when something went wrong
// set(v) writes and updates state immediately
```

---

## `attempt` standalone usage

The `attempt` helper is not limited to storage. Use it anywhere a try/catch would otherwise be needed:

```typescript
import { attempt } from '@/lib/utils/attempt'

// Sync
const parsed = attempt(() => JSON.parse(rawString))
if (!parsed.ok) return fallback

// Async
const fetched = await attempt(() => fetch(url).then(r => r.json()))
if (!fetched.ok) handleFetchError(fetched.error)
```

---

## Key invariants to preserve during migration

- **Storage keys stay the same** — do not change key strings. Existing persisted data must still be readable.
- **Defaults stay the same** — each call site's current fallback value must be passed as `defaultValue`.
- **SSR safety is provided by the utility layer** — remove per-call `globalThis.window` guards after migration; the storage module handles this centrally.
- **Error behavior matches or improves current behavior** — current code silently swallows errors in `catch {}` blocks. After migration, errors are still not thrown but are available via `AttemptResult.error` or hook's `error` field.

---

## Test approach

| Test file | What to cover |
|-----------|--------------|
| `attempt.test.ts` | Sync success, sync throw, async success, async rejection |
| `storage.test.ts` | Valid read, missing key, malformed JSON, quota exceeded write, unavailable storage (SSR mock), sessionStorage path |
| `use-storage.test.ts` | Initial value, hydration read, `set` updates state, `remove` resets, cross-tab storage event, error state on failure |
