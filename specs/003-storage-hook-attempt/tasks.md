# Tasks: Centralized Storage Hook with Attempt Helper

**Input**: Design documents from `/specs/003-storage-hook-attempt/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/hooks-api.md ✓, quickstart.md ✓

**Tests**: Included — storage and hook logic has clear error paths that benefit from explicit test coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on in-progress tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in every task description

---

## Phase 1: Foundational — `attempt` Helper

**Purpose**: General-purpose try/catch helper that ALL user stories and migration sites depend on. Must be complete before any Phase 2+ work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Implement `attempt` helper in `src/lib/utils/attempt.ts`: export `AttemptResult<T>` discriminated union type (`{ ok: true; value: T } | { ok: false; error: unknown }`), and overloaded `attempt` function — four signatures: sync without fallback, sync with fallback (`T | (() => T)`), async without fallback, async with fallback (`T | (() => T | Promise<T>)`). Implementation: call `fn()` in try/catch; dispatch on `result instanceof Promise` for async path; if `fn` throws and a fallback is provided, resolve it (plain value → `{ ok: true, value: fallback }`; function → call it in its own try/catch → succeed or return `{ ok: false, error: originalError }`). Never throws and never returns a rejected Promise.
- [X] T002 [P] Write unit tests for `attempt` in `src/__tests__/lib/utils/attempt.test.ts`: sync success, sync throw (no fallback → `ok: false`), sync throw with value fallback (→ `ok: true, value: fallback`), sync throw with function fallback that succeeds (→ `ok: true`), sync throw with function fallback that also throws (→ `ok: false, error: originalError`), async resolution, async rejection (no fallback), async rejection with value fallback, async rejection with async function fallback. Verify `ok` discriminant, `value` on success, `error` on failure, and that the function itself never throws.

**Checkpoint**: `attempt.ts` is complete and tested. User story work may begin.

---

## Phase 2: User Story 1 — Safe Storage Read (Priority: P1) 🎯 MVP

**Goal**: `readStorage<T>` utility that reads from `localStorage` or `sessionStorage`, handles SSR, absent keys, and JSON parse failures — all via `attempt` — and returns `AttemptResult<T | null>`.

**Independent Test**: Call `readStorage` with (a) a valid JSON value, (b) a missing key, (c) malformed JSON, (d) `window` undefined (SSR) — all return `AttemptResult` without throwing.

- [X] T003 [US1] Implement `readStorage<T>` in `src/lib/utils/storage.ts`: export `StorageType = 'local' | 'session'`, a private `getStorage(type)` helper that returns `null` when `typeof window === 'undefined'`, and `readStorage<T>(key, options?: { storage?, defaultValue? }): AttemptResult<T | null>`. When storage is unavailable (SSR), returns `{ ok: true, value: options.defaultValue ?? null }` — a successful result with the safe default (FR-008). Otherwise wraps `JSON.parse(store.getItem(key))` in `attempt`; returns `{ ok: true, value: defaultValue ?? null }` when key is absent.
- [X] T004 [P] [US1] Write tests for `readStorage` in `src/__tests__/lib/utils/storage.test.ts`: valid JSON read, missing key returns `{ ok: true, value: defaultValue }`, missing key returns `{ ok: true, value: null }` when no default, malformed JSON returns `{ ok: false }`, SSR (`window === undefined`) returns `{ ok: true, value: defaultValue }` (not a failure — FR-008), sessionStorage path via `options.storage: 'session'`.

**Checkpoint**: `readStorage` is complete and tested independently.

---

## Phase 3: User Story 2 — Safe Storage Write (Priority: P1)

**Goal**: `writeStorage<T>` utility that serializes a value to storage via `attempt`, capturing `QuotaExceededError` and any other write failure as `{ ok: false, error }`.

**Independent Test**: Call `writeStorage` with (a) a valid value, (b) `window` undefined, (c) a mocked `setItem` that throws `QuotaExceededError` — each returns the correct `AttemptResult` without throwing.

- [X] T005 [US2] Add `writeStorage<T>` to `src/lib/utils/storage.ts`: `writeStorage<T>(key, value, options?: { storage? }): AttemptResult<void>`. Returns `{ ok: false, error }` immediately when storage unavailable. Wraps `store.setItem(key, JSON.stringify(value))` in `attempt`. Handles any thrown error including `QuotaExceededError`.
- [X] T006 [P] [US2] Extend `src/__tests__/lib/utils/storage.test.ts` with `writeStorage` tests: valid write persists value, SSR returns `{ ok: false }`, `QuotaExceededError` returns `{ ok: false }` (mock `setItem` to throw), non-serializable value throws and is captured.

**Checkpoint**: `writeStorage` is complete and tested independently.

---

## Phase 4: User Story 3 — Safe Storage Delete (Priority: P2)

**Goal**: `removeStorage` utility that removes a key from storage via `attempt`, never throwing even for absent keys or unavailable storage.

**Independent Test**: Call `removeStorage` with (a) an existing key, (b) a non-existent key, (c) `window` undefined — all return `AttemptResult<void>` without throwing.

- [X] T007 [US3] Add `removeStorage` to `src/lib/utils/storage.ts`: `removeStorage(key, options?: { storage? }): AttemptResult<void>`. Returns `{ ok: false, error }` immediately when storage unavailable. Wraps `store.removeItem(key)` in `attempt`.
- [X] T008 [P] [US3] Extend `src/__tests__/lib/utils/storage.test.ts` with `removeStorage` tests: removes existing key, succeeds on absent key (no throw), SSR returns `{ ok: false }`, error during `removeItem` is captured.

**Checkpoint**: All three storage utility functions (`readStorage`, `writeStorage`, `removeStorage`) are complete and tested. Full utility layer is ready.

---

## Phase 5: User Story 4 — Migration (Priority: P2)

**Goal**: Replace all direct `localStorage`/`sessionStorage` calls with the storage utilities and `useStorage` hook. Zero raw storage access outside `storage.ts` after this phase.

**Independent Test**: `grep -r "localStorage\|sessionStorage" src/ --include="*.ts" --include="*.tsx"` returns matches only within `src/lib/utils/storage.ts`. All existing feature tests continue to pass.

### Hook Implementation

- [X] T009 [US4] Create `useStorage<T>` hook in `src/hooks/use-storage.ts`. Implement: `useState` initialized to `defaultValue ?? null`; `useEffect` for post-hydration read via `readStorage`; `useEffect` for `storage` event listener (cross-tab sync only — same-page non-hook writes are NOT reflected; cleanup on unmount); `set(value: T): AttemptResult<void>` wrapped in `useCallback` — writes via `writeStorage` and updates state immediately on success; `remove(): AttemptResult<void>` wrapped in `useCallback` — removes via `removeStorage` and resets to `defaultValue ?? null` on success. Returns `{ value, error, set, remove }`. API contract: `specs/003-storage-hook-attempt/contracts/hooks-api.md`.
- [X] T010 [P] [US4] Write tests for `useStorage` in `src/__tests__/hooks/use-storage.test.ts`: initial value is `defaultValue` before hydration, post-hydration reads stored value, `set` updates state and persists, `remove` resets to default, `error` is populated on read/write failure, `storage` event from another tab updates value, event listener is cleaned up on unmount.

### Non-React Utility Migration (parallel — only need `storage.ts` utilities)

- [X] T011 [P] [US4] Migrate `src/lib/utils/history.ts`: replace `localStorage.getItem`, `localStorage.setItem`, `localStorage.removeItem` calls with `readStorage`, `writeStorage`, `removeStorage` from `@/lib/utils/storage`. Remove per-function `globalThis.window === undefined` guards and inline `try/catch` blocks (now handled centrally). Preserve all existing key strings, serialize/deserialize logic, and `MAX_ENTRIES` slicing.
- [X] T012 [P] [US4] Migrate `src/lib/utils/savings.ts`: replace `localStorage.getItem`, `localStorage.setItem`, `localStorage.removeItem` with `readStorage`, `writeStorage`, `removeStorage`. Remove inline SSR guards and `try/catch` blocks. Preserve `SAVINGS_KEY`, `SavingsData` type, `EMPTY` default, and `CustomEvent` dispatch logic.
- [X] T013 [P] [US4] Migrate `src/lib/config/model-config.ts`: replace `localStorage.getItem` in `loadModelConfig` with `readStorage<ModelConfig>` using `defaultValue: DEFAULTS`. Remove the inline `globalThis.window` guard and `try/catch`. Preserve `STORAGE_KEY`, `DEFAULTS` merge behavior (`{ ...DEFAULTS, ...parsed }`), and all existing exports.
- [X] T014 [P] [US4] Migrate `src/components/model/settings/use-persisted-model-config.ts`: replace bare `localStorage.setItem(STORAGE_KEY, ...)` in `handleSave` and `localStorage.removeItem(STORAGE_KEY)` in `handleReset` with `writeStorage` and `removeStorage` from `@/lib/utils/storage`. These two calls currently have no try/catch — after migration they have proper error capture. Do not change any other state logic in this hook. (Uses utility layer only — no hook dependency; can run in parallel with T009.)

### React Component Migration (depend on T009 hook being complete)

- [X] T015 [P] [US4] Migrate `src/components/layout/ThemeToggle.tsx`: replace both `localStorage.setItem('theme', 'light')` and `localStorage.setItem('theme', 'dark')` with `writeStorage('theme', 'light')` / `writeStorage('theme', 'dark')` from `@/lib/utils/storage`. No other logic changes.
- [X] T016 [P] [US4] Migrate `src/components/ui/sidebar.tsx`: replace `globalThis.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)` in the width-init `useEffect` with `readStorage<number>(SIDEBAR_WIDTH_STORAGE_KEY)`; replace `globalThis.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clamped))` in `setDesktopSidebarWidth` with `writeStorage(SIDEBAR_WIDTH_STORAGE_KEY, clamped)`. Preserve existing `globalThis.window !== undefined` guard around `setItem` (now redundant — remove it; SSR guard is in `writeStorage`). Preserve number parsing/clamping logic.

### Cleanup

- [X] T017 [P] [US4] Remove stale comment `// Side effect: writes to localStorage (clears chat input via onContent callback)` in `src/hooks/use-file-attachment.ts` (line ~35) — this comment is inaccurate; the function does not call localStorage.

**Checkpoint**: All migration sites updated. Zero direct `localStorage`/`sessionStorage` calls outside `src/lib/utils/storage.ts`.

---

## Phase 6: Polish & Verification

**Purpose**: Confirm complete migration and no regressions.

- [X] T018 Verify migration completeness: run `grep -rn "localStorage\|sessionStorage" src/ --include="*.ts" --include="*.tsx"` and confirm only `src/lib/utils/storage.ts` appears in results. Note: `.astro` files are excluded from this check — `src/layouts/AppLayout.astro` contains a documented exception (`is:inline` theme-initializer script that cannot use ESM imports; see spec Assumptions).
- [X] T019 [P] Run full test suite (`npm test` or `pnpm test`) and confirm all pre-existing tests pass alongside new tests. Fix any regressions before closing the feature.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational — `attempt`)**: No dependencies — start immediately
- **Phase 2 (US1 — Read)**: Requires Phase 1 complete
- **Phase 3 (US2 — Write)**: Requires Phase 1 complete; can begin after T003 exists in `storage.ts`
- **Phase 4 (US3 — Delete)**: Requires Phase 1 complete; can begin after T005 exists in `storage.ts`
- **Phase 5 (US4 — Migration)**:
  - T009 (hook): Requires Phase 2–4 complete (needs all three utility functions)
  - T010 (hook tests): Requires T009
  - T011–T014 (non-React/utility-only migration): Requires Phase 2–4 complete (utility layer); all four are independent of T009
  - T015–T016 (React component migration): Requires T009 (hook)
  - T017 (comment): No dependencies
- **Phase 6 (Polish)**: Requires Phase 5 complete

### User Story Dependencies

- **US1 (P1)**: Requires Foundational (Phase 1). No other story dependency.
- **US2 (P1)**: Requires Phase 1. Extends `storage.ts` started in US1; begin after T003.
- **US3 (P2)**: Requires Phase 1. Extends `storage.ts`; begin after T005.
- **US4 (P2)**: Requires US1 + US2 + US3 complete (full utility layer). T011–T014 can all run in parallel once utility layer is done (none need the hook). T015–T016 can run in parallel once T009 is done.

### Within Each Phase

- Implementation task first, then test task (both are marked [P] where they touch different files)
- For `storage.ts`: implement each function before writing its tests — they extend the same test file sequentially
- For migration: T011/T012/T013 are fully independent of each other (different files)
- For React migrations: T015/T016/T017 are independent of each other and of T014

---

## Parallel Execution Examples

### Phase 1: Foundational

```
T001: Implement attempt.ts
T002: [P] Write attempt.test.ts  ← can run in parallel with T001 (different file, TDD)
```

### Phase 5: US4 Migration

```
# Once utility layer is done (T003–T008), these run in parallel (no hook dependency):
T011: Migrate history.ts
T012: Migrate savings.ts
T013: Migrate model-config.ts
T014: Migrate use-persisted-model-config.ts  ← uses utility layer only
T017: Remove stale comment in use-file-attachment.ts

# T009 (hook) can also start once utility layer is done — runs in parallel with T011–T014
T009: Create useStorage hook

# Once T009 is done, these run in parallel:
T010: Write use-storage.test.ts
T015: Migrate ThemeToggle.tsx
T016: Migrate sidebar.tsx
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1: `attempt.ts`
2. Complete Phase 2: `readStorage` + tests
3. **STOP and VALIDATE**: Call `readStorage` manually — all 4 test scenarios work
4. Optionally demo: replace one call site (e.g., `model-config.ts`) to prove the utility in action

### Incremental Delivery

1. Phase 1 → Foundation ready (`attempt`)
2. Phase 2 → Safe reads (US1 ✓)
3. Phase 3 → Safe writes (US2 ✓)
4. Phase 4 → Safe deletes (US3 ✓) — full utility layer complete
5. Phase 5 → Migration + hook (US4 ✓) — zero raw localStorage access
6. Phase 6 → Verified clean

### Parallel Strategy

With multiple developers:
1. Developer A: T001 + T002 (Phase 1)
2. Once Phase 1 complete:
   - Developer A: T003 + T004 (US1)
   - Developer B: Prepare test scaffolding (storage.test.ts, use-storage.test.ts stubs)
3. Once utility layer complete (T003–T008):
   - Developer A: T009 + T010 (hook)
   - Developer B: T011 + T012 + T013 (non-React migrations, fully parallel)
4. Once T009 complete:
   - T014, T015, T016 in parallel (React migrations)

---

## Notes

- `[P]` tasks touch different files and have no dependency on in-progress tasks in the same phase
- `[USx]` label maps each task to its user story for traceability
- The only sequential constraint in storage.ts: implement readStorage (T003) → writeStorage (T005) → removeStorage (T007), as they all extend the same file
- Each user story is independently completable after Phase 1 (attempt) is done
- Run `npm test` / `pnpm test` after each phase checkpoint to catch regressions early
- Existing storage keys must not change — this feature changes access patterns only, not stored data
