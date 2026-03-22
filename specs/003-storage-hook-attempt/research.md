# Research: Centralized Storage Hook with Attempt Helper

**Branch**: `003-storage-hook-attempt` | **Date**: 2026-03-22

## Decision 1: `attempt` Result Shape

**Decision**: Discriminated union `{ ok: true; value: T } | { ok: false; error: unknown }`

**Rationale**: TypeScript narrows the type automatically after an `ok` check — no index guessing, no runtime casts. Zod (`.safeParse()`), TanStack Query, and tRPC all follow this convention. The project itself already uses discriminated unions in `AssistantMessage` (status + error fields in `route.ts`).

**Alternatives considered**:
- Go-style tuple `[null, T] | [unknown, null]` — shorter but requires positional awareness, poor discoverability, and gives no compiler guarantee of alignment between indexes.
- Throwing exceptions — ruled out by spec (FR-001, FR-003).

---

## Decision 1b: `attempt` Fallback Parameter

**Decision**: Optional second argument `fallback?: T | (() => T | Promise<T>)`. When the primary `fn` fails: plain value → always recovers as `{ ok: true, value: fallback }`; function → called in its own try/catch → succeeds or returns `{ ok: false, error: originalError }` (original error preserved, not the fallback's error).

**Rationale**: Callers often want to provide a safe default without wrapping `attempt` in another conditional. The fallback collapses a two-step pattern (`const r = attempt(fn); const val = r.ok ? r.value : default`) into a single call (`attempt(fn, default)`). Preserving the original error on fallback failure keeps debugging straightforward — callers see why the primary operation failed, not a secondary error.

**Why accept both value and function**: A plain value fallback (`attempt(fn, [])`) is the common case and the most concise. A function fallback (`attempt(fn, () => expensiveDefault())`) is needed when the fallback itself is lazy or may fail (e.g., reading from a secondary cache).

**Alternatives considered**:
- `options` object (`attempt(fn, { fallback })`) — more verbose for the common case; no benefit over a positional arg since `attempt` has exactly one optional extra parameter.
- Separate `attemptWithFallback` function — redundant API surface; callers must remember two function names.
- Ignoring fallback errors (always returning `{ ok: true }` when fallback throws) — hides bugs; preserving original error is safer.

---

## Decision 1c: `readStorage` defaultValue vs `attempt` fallback — Composition

**Decision**: `readStorage` handles key-absent as a **non-error case** (returns `{ ok: true, value: defaultValue ?? null }`) and uses `attempt` only for the JSON parse step. The `defaultValue` is checked **after** a successful `getItem` call returns `null` (absent key) — not passed as `attempt`'s fallback. These two mechanisms are independent layers:
- `attempt(fn, fallback)` — recovers from thrown exceptions in the fn
- `readStorage defaultValue` — handles the semantically valid "key not found" case (not an exception)

SSR is a third case handled before either: when storage is unavailable, `readStorage` returns `{ ok: true, value: defaultValue ?? null }` immediately (FR-008), without invoking `attempt` at all.

**Example internal flow of `readStorage`**:
```
1. If typeof window === 'undefined' → return { ok: true, value: defaultValue ?? null }
2. result = attempt(() => store.getItem(key))   // catches SecurityError etc.
3. If !result.ok → return { ok: false, error: result.error }
4. If result.value === null → return { ok: true, value: defaultValue ?? null }  // key absent
5. parseResult = attempt(() => JSON.parse(result.value))  // catches SyntaxError
6. Return parseResult (ok: true with parsed value, or ok: false on malformed JSON)
```

---

## Decision 2: Sync + Async `attempt` Overloading

**Decision**: Single `attempt` function with TypeScript overload signatures — sync overload returns `AttemptResult<T>`, async overload returns `Promise<AttemptResult<T>>`. Implementation dispatches on `result instanceof Promise`.

**Rationale**: One export, no naming friction (`attempt` vs `attemptAsync`). The `instanceof Promise` check is a reliable synchronous discriminator. Callers receive the correct return type inferred by the overload resolver.

**Alternatives considered**:
- Two separate exports `attempt` / `attemptAsync` — redundant API surface; both would be needed everywhere.
- Conditional types with generic flag — more complex, provides no additional safety over overloads.

---

## Decision 3: Storage Event Cross-Tab vs Same-Page Reactivity

**Decision**: Subscribe to the native `storage` event for cross-tab updates. For same-page reactivity, update `useState` directly inside the hook's `set`/`remove` callbacks (state is the source of truth; storage is the side-effect).

**Rationale**: The `storage` event fires only in other tabs — not in the originating tab. This is intentional browser behavior to prevent feedback loops. The standard pattern is: (1) `set` writes to both React state AND localStorage simultaneously, so the current tab sees the change immediately via state; (2) the `storage` listener catches external changes. The project already follows this in `useChatSession` (state updated via `setEntries`, persisted via `saveHistory` as a side-effect).

**Alternatives considered**:
- Custom `CustomEvent` dispatch on write for same-page broadcasting — adds runtime complexity; only needed if multiple hook instances for the same key need to sync within one tab, which can be solved by lifting state.
- Using a global singleton map — over-engineered for current scope.

---

## Decision 4: Module File Locations

**Decision**:
- `src/lib/utils/attempt.ts` — general-purpose helper, lives with other small utilities (`format.ts`, `sse.ts`)
- `src/lib/utils/storage.ts` — plain storage utility functions, layer 1
- `src/hooks/use-storage.ts` — React hook, layer 2 (follows existing hook convention: `use-chat-session.ts`, `use-mobile.ts`)

**Rationale**: The project has a clear, established convention: simple utilities go in `src/lib/utils/`, custom hooks go in `src/hooks/`. Splitting into `src/lib/storage/` would be premature given the single-file scope of the utility layer.

**Alternatives considered**:
- `src/lib/storage/index.ts` — appropriate for a module family; not warranted here since the storage utilities are a thin wrapper with no sub-modules.

---

## Decision 5: Hook API Shape

**Decision**: `useStorage<T>(key, options?) → { value: T | null, error: unknown | null, set(v: T): AttemptResult<void>, remove(): AttemptResult<void> }`

**Rationale**:
- `value` and `error` as separate state fields follows the standard React data-fetching pattern (cf. React Query `{ data, error }`). Callers can ignore `error` if they only need the value.
- `set` and `remove` return the `AttemptResult` directly so callers that need to react to write failures can do so, but callers that don't can ignore the return value.
- `options.defaultValue` initializes `value` before hydration completes (SSR-safe default), and is returned on missing key or parse failure.
- `options.storage` selects `'local'` (default) or `'session'`.

---

## Decision 6: SSR Guard Strategy

**Decision**: Inside the utility layer, check `typeof window === 'undefined'` (or `globalThis.window === undefined`) before accessing the storage object. Return `{ ok: false, error: new Error('Storage unavailable') }` immediately. The hook initializes value to `defaultValue ?? null` before hydration.

**Rationale**: The project already uses `globalThis.window === undefined` guards in `history.ts`, `savings.ts`, and `model-config.ts`. Centralizing this in the utility layer removes the need for per-call site guards.

---

## Migration Site Inventory

| File | Operations | Migration action |
|------|-----------|-----------------|
| `src/lib/utils/history.ts` | getItem, setItem, removeItem | Replace with `readStorage`, `writeStorage`, `removeStorage` |
| `src/lib/utils/savings.ts` | getItem, setItem, removeItem | Replace with `readStorage`, `writeStorage`, `removeStorage` |
| `src/lib/config/model-config.ts` | getItem | Replace with `readStorage` |
| `src/components/model/settings/use-persisted-model-config.ts` | setItem, removeItem | Replace with `writeStorage`, `removeStorage` |
| `src/components/layout/ThemeToggle.tsx` | setItem ×2 | Replace with `writeStorage` |
| `src/components/ui/sidebar.tsx` | getItem, setItem | Replace with `readStorage`, `writeStorage` |

Note: `src/hooks/use-file-attachment.ts` has a misleading comment `// Side effect: writes to localStorage` but does NOT call localStorage. Comment should be removed.
