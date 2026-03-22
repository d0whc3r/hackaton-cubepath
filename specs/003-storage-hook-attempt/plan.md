# Implementation Plan: Centralized Storage Hook with Attempt Helper

**Branch**: `003-storage-hook-attempt` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-storage-hook-attempt/spec.md`

## Summary

Centralize all `localStorage`/`sessionStorage` access behind two new modules: (1) a general-purpose `attempt` helper that wraps any fallible operation in a typed try/catch, and (2) a two-layer storage abstraction — plain utility functions (`readStorage`, `writeStorage`, `removeStorage`) for non-React modules, and a reactive `useStorage` hook for React components. Migrate all 6 existing direct-storage call sites to use the new utilities.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode)
**Primary Dependencies**: React 18+, Vitest + happy-dom (testing)
**Storage**: Browser localStorage / sessionStorage (Web Storage API)
**Testing**: Vitest with `vi.spyOn`, `happy-dom` environment
**Target Platform**: Browser (Astro + React islands); SSR must not crash
**Project Type**: Web application (Astro frontend with React islands)
**Performance Goals**: Storage operations are synchronous; no async latency targets. Zero unhandled exceptions from storage paths.
**Constraints**: SSR-safe (no `window` access at module level); existing storage keys must remain unchanged; no encryption or quota management beyond error capture.
**Scale/Scope**: 6 migration sites, 3 new modules, 3 new test files

## Constitution Check

The project constitution template is unfilled (no active principles defined). No gate violations detected. Proceeding with standard best practices as the governing guide:

- Single responsibility: each module does one thing
- Test-first where feasible: tests defined before/alongside implementation
- No breaking changes: existing storage keys and fallback values preserved
- Simplicity: no abstraction beyond what the 6 migration sites require

## Project Structure

### Documentation (this feature)

```
specs/003-storage-hook-attempt/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── hooks-api.md     ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code

```
src/
├── lib/
│   └── utils/
│       ├── attempt.ts          ← NEW
│       └── storage.ts          ← NEW (imports attempt.ts)
└── hooks/
    └── use-storage.ts          ← NEW (imports storage.ts)

src/__tests__/
├── lib/
│   └── utils/
│       ├── attempt.test.ts     ← NEW
│       └── storage.test.ts     ← NEW
└── hooks/
    └── use-storage.test.ts     ← NEW

# Migration sites (modified, not moved)
src/lib/utils/history.ts
src/lib/utils/savings.ts
src/lib/config/model-config.ts
src/components/model/settings/use-persisted-model-config.ts
src/components/layout/ThemeToggle.tsx
src/components/ui/sidebar.tsx
```

**Structure Decision**: Single-project web application. New modules slot into the existing `src/lib/utils/` and `src/hooks/` directories, following the project's established conventions exactly.

---

## Phase 0 — Research (complete)

See [research.md](./research.md) for full findings. Key decisions resolved:

| Question | Decision |
|----------|----------|
| `attempt` result shape | Discriminated union `{ ok: true; value: T } \| { ok: false; error: unknown }` |
| Sync + async `attempt` | Single function, two overload signatures, `instanceof Promise` dispatch |
| Cross-tab reactivity | `storage` event for other tabs + direct `setState` for same-tab writes |
| File locations | `src/lib/utils/attempt.ts`, `src/lib/utils/storage.ts`, `src/hooks/use-storage.ts` |
| Hook API shape | `{ value, error, set, remove }` — value is typed state, error is exposed |
| SSR guard | Centralized in utility layer (`typeof window === 'undefined'` check) |

---

## Phase 1 — Design & Contracts (complete)

### Layer 1: `attempt` helper (`src/lib/utils/attempt.ts`)

```typescript
export type AttemptResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: unknown }

// Sync — no fallback
export function attempt<T>(fn: () => T): AttemptResult<T>
// Sync — with fallback (plain value or function)
export function attempt<T>(fn: () => T, fallback: T | (() => T)): AttemptResult<T>
// Async — no fallback
export function attempt<T>(fn: () => Promise<T>): Promise<AttemptResult<T>>
// Async — with fallback (value or sync/async function)
export function attempt<T>(fn: () => Promise<T>, fallback: T | (() => T | Promise<T>)): Promise<AttemptResult<T>>
// Implementation: try/catch + instanceof Promise dispatch; fallback called in its own try/catch
```

**Design rationale**:
- `ok` as discriminant gives TypeScript full type narrowing in both branches
- Four overload signatures; no `attemptAsync` naming pollution
- Optional `fallback` parameter: plain value always recovers; function fallback tried in its own try/catch; on fallback failure the **original** error is preserved
- `error: unknown` (not `Error`) because JavaScript can throw anything
- General-purpose: zero coupling to storage

### Layer 2: Storage Utilities (`src/lib/utils/storage.ts`)

```typescript
export type StorageType = 'local' | 'session'

export function readStorage<T>(key: string, options?: {
  storage?: StorageType
  defaultValue?: T
}): AttemptResult<T | null>

export function writeStorage<T>(key: string, value: T, options?: {
  storage?: StorageType
}): AttemptResult<void>

export function removeStorage(key: string, options?: {
  storage?: StorageType
}): AttemptResult<void>
```

**Design rationale**:
- Each function returns `AttemptResult` directly — callers (e.g., `history.ts`) can inspect or ignore the result
- JSON serialization is automatic — callers work with typed values, not raw strings
- SSR guard is internal: check `typeof window === 'undefined'` before accessing storage object; `readStorage` returns `{ ok: true, value: defaultValue ?? null }` on SSR (safe default, matches FR-008); `writeStorage` and `removeStorage` return `{ ok: false, error }` on SSR (graceful failure, nothing was written)
- `defaultValue` for reads: returned when key is absent or parse fails, so call sites don't need conditional logic
- `storage` option defaults to `'local'` — matches all existing usage

### Layer 3: React Hook (`src/hooks/use-storage.ts`)

```typescript
export function useStorage<T>(key: string, options?: {
  storage?: StorageType
  defaultValue?: T
}): {
  value: T | null
  error: unknown | null
  set: (value: T) => AttemptResult<void>
  remove: () => AttemptResult<void>
}
```

**Design rationale**:
- Hydration-safe: `value` initializes to `defaultValue ?? null` before first `useEffect` runs
- `useEffect` reads from storage after mount (avoids SSR mismatch)
- `set` writes to storage via `writeStorage` AND updates `useState` immediately — no round-trip latency
- `storage` event listener for cross-tab sync (other-tab changes update `value`)
- `error` field: last captured failure, or `null` — callers opt in to error handling
- `set` / `remove` return `AttemptResult<void>` — callers can react to failures if needed
- `useCallback` for `set` and `remove` — stable refs, safe for `useEffect` dependencies

### Migration pattern per call site

| File | Before | After |
|------|--------|-------|
| `history.ts` | `localStorage.getItem/setItem/removeItem` + `try/catch` + `globalThis.window` guards | `readStorage` / `writeStorage` / `removeStorage` — SSR guard and error capture centralized |
| `savings.ts` | Same pattern as `history.ts` | Same migration |
| `model-config.ts` | `localStorage.getItem` + `try/catch` + window guard | `readStorage` with `defaultValue: DEFAULTS` |
| `use-persisted-model-config.ts` | Bare `localStorage.setItem` / `localStorage.removeItem` (no try/catch!) | `writeStorage` / `removeStorage` |
| `ThemeToggle.tsx` | Bare `localStorage.setItem` ×2 (no try/catch) | `writeStorage` |
| `sidebar.tsx` | `globalThis.localStorage.getItem/setItem` | `readStorage` / `writeStorage` |

Note: `use-file-attachment.ts` has a stale comment `// Side effect: writes to localStorage` but makes no storage calls — remove the comment only.

### Artifact output

- [data-model.md](./data-model.md) — types, state lifecycle, serialization rules
- [contracts/hooks-api.md](./contracts/hooks-api.md) — full API contract for all three modules
- [quickstart.md](./quickstart.md) — migration guide, before/after patterns, test approach

---

## Complexity Tracking

No constitution violations. No added complexity beyond what is directly required.
