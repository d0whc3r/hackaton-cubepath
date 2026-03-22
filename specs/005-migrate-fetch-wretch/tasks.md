# Tasks: Migrate fetch to wretch

**Input**: Design documents from `/specs/005-migrate-fetch-wretch/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, contracts/http-clients.md ✓

**Organization**: Tasks grouped by user story — each story is independently implementable and testable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Dependencies & Config)

**Purpose**: Install new packages and wire up test infrastructure configuration. Nothing in the app changes yet.

- [ ] T001 Add `wretch` and `wretch-middlewares` as production dependencies in `package.json` (run `pnpm add wretch wretch-middlewares`)
- [ ] T002 Add `msw` as dev dependency in `package.json` (run `pnpm add -D msw`)
- [ ] T003 Update `vitest.config.ts` — add `setupFiles: ['src/__tests__/msw/setup.ts']` to the `test` config block

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the two shared wretch clients and the full MSW test infrastructure. MUST be complete before any user story work begins.

**⚠️ CRITICAL**: All user story tasks depend on this phase being complete.

- [ ] T004 Create `src/lib/http/ollama-client.ts` — export `ollamaWretch` as a server-side wretch base instance with `retry({ maxAttempts: 3, delayTimer: 500, exponential: true, until: (res) => res != null && res.status < 500 })` and `dedupe()` middleware from `wretch-middlewares`; no fixed base URL (Ollama URL is dynamic per-request)
- [ ] T005 [P] Create `src/lib/http/app-client.ts` — export `appWretch` as a client-side wretch base instance with `QueryStringAddon` from `wretch/addons/queryString`, plus `retry({ maxAttempts: 3, delayTimer: 500, exponential: true, until: (res) => res != null && res.status < 500 })` and `dedupe()` middleware from `wretch-middlewares`; no fixed base URL (all paths are relative `/api/...`)
- [ ] T006 [P] Create `src/__tests__/msw/server.ts` — set up MSW node server with `setupServer(...handlers)` importing from `./handlers`
- [ ] T007 [P] Create `src/__tests__/msw/setup.ts` — call `beforeAll`, `afterEach`, `afterAll` as **module-level side-effects** (not exported): `beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))`, `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())`; Vitest's `setupFiles` executes this module automatically
- [ ] T008 [P] Create `src/__tests__/msw/handlers/ollama.ts` — define MSW handlers for: (happy path) `GET http://localhost:11434/api/tags` → `{ models: [{ name: 'llama3.2:latest' }] }`, `POST http://localhost:11434/api/show` → capabilities/details JSON, `POST http://localhost:11434/api/pull` → minimal SSE stream; (error cases) also export `ollamaErrorHandlers` with `GET http://localhost:11434/api/tags` → HTTP 500, `POST http://localhost:11434/api/show` → HTTP 404, and a network-failure handler for use in T022 via `server.use()`
- [ ] T009 [P] Create `src/__tests__/msw/handlers/app.ts` — define MSW handlers for `GET /api/ollama/models`, `GET /api/ollama/model`, `POST /api/ollama/pull`, `POST /api/route`, `POST /api/translate`; also export `appErrorHandlers` with HTTP 500/404 variants for use in T023 via `server.use()`; create `src/__tests__/msw/handlers/index.ts` barrel that re-exports `[...ollamaHandlers, ...appHandlers]` as the default combined array imported by `server.ts`

**Checkpoint**: Foundation ready — run `pnpm test` to confirm existing tests still pass with new `setupFiles` wired in.

---

## Phase 3: User Story 1 — Centralized HTTP Client Configuration (Priority: P1) 🎯 MVP

**Goal**: Replace every raw `fetch(` call in `src/` with either `ollamaWretch` (server-side) or `appWretch` (client-side) so that zero raw `fetch(` calls remain.

**Independent Test**: Run `grep -r "fetch(" src/` — result must be empty. Run the application and confirm all Ollama model listing, pull, routing, and translation flows work identically.

### Implementation for User Story 1

- [ ] T010 [P] [US1] Migrate `src/pages/api/ollama/models.ts` — replace `fetch(\`${baseUrl}/api/tags\`, { signal })` with `ollamaWretch.url(\`${baseUrl}/api/tags\`).signal(AbortSignal.timeout(OLLAMA_TIMEOUT_MS)).get().json<OllamaTagsResponse>()`; wretch throws `WretchError` on non-OK, which the existing outer `try/catch` catches and returns the fallback `{ models: [] }` response — remove the manual `.then(r => r.json())` chain
- [ ] T011 [P] [US1] Migrate `src/pages/api/ollama/model.ts` — replace both `fetch(...)` calls in the `Promise.all` with `ollamaWretch.url(\`${baseUrl}/api/show\`).signal(AbortSignal.timeout(OLLAMA_TIMEOUT_MS)).post({ model }).json<ShowResponse>()` and `ollamaWretch.url(\`${baseUrl}/api/tags\`).signal(AbortSignal.timeout(OLLAMA_TIMEOUT_MS)).get().json<TagsResponse>()`; wretch throws `WretchError` on non-OK, caught by the existing `try/catch`; remove manual `JSON.stringify` from the POST body (wretch handles serialization) and remove the `if (!showRes.ok)` guard
- [ ] T012 [P] [US1] Migrate `src/pages/api/ollama/pull.ts` — replace `fetch(\`${baseUrl}/api/pull\`, { body, headers, method, signal })` with `ollamaWretch.url(\`${baseUrl}/api/pull\`).signal(AbortSignal.timeout(PULL_TIMEOUT_MS)).post({ name: model, stream: true }).res()`; all subsequent `ollamaRes.body.getReader()` streaming code stays unchanged
- [ ] T013 [P] [US1] Migrate `src/components/model/settings/use-installed-models.ts` — replace `fetch(\`/api/ollama/models?baseUrl=…\`, { signal })` with `appWretch.url('/api/ollama/models').query({ baseUrl: ollamaBaseUrl }).signal(abort.signal).get().json<{ models?: string[] }>()`; remove manual `.then(r => r.json())` chain
- [ ] T014 [P] [US1] Migrate `src/components/model/settings/use-runtime-model-details.ts` — replace `fetch(\`/api/ollama/model?baseUrl=…&model=…\`, { signal })` with `appWretch.url('/api/ollama/model').query({ baseUrl: ollamaBaseUrl, model: modelId }).signal(abort.signal).get().json<{ details?: RuntimeModelDetails | null }>()`; remove manual `.then(r => r.json())` chain
- [ ] T015 [P] [US1] Migrate `src/components/chat/TranslateButton.tsx` — replace `fetch('/api/translate', { body, headers, method, signal })` with `appWretch.url('/api/translate').signal(abort.signal).post({ model, ollamaBaseUrl: cfg.ollamaBaseUrl, targetLanguage: language.label, text: stripped }).res()`; all subsequent `res.body` SSE streaming code stays unchanged; remove `headers: { 'Content-Type': 'application/json' }` (wretch adds it automatically for `.post(object)`)
- [ ] T016 [P] [US1] Migrate `src/components/model/settings/use-model-pull.ts` — replace `fetch('/api/ollama/pull', { body, headers, method, signal })` with `appWretch.url('/api/ollama/pull').signal(abort.signal).post({ baseUrl, model: modelId }).res()`; all subsequent `response.body.getReader()` streaming code stays unchanged; remove manual `JSON.stringify` and `Content-Type` header
- [ ] T017 [P] [US1] Migrate `src/lib/services/route.service.ts` — replace `fetch('/api/route', { body, headers, method, signal })` with `appWretch.url('/api/route').signal(signal).post(body).res()`; **this is a streaming call site** so `.res()` is correct and the existing manual `if (!res.ok)` check MUST remain (`.res()` bypasses wretch error catchers); preserve the `throw new Error(json.message ?? ...)` error path unchanged; remove `headers: { 'Content-Type': 'application/json' }` and manual `JSON.stringify(body)` (wretch handles both)

**Checkpoint**: Run `grep -r "= await fetch\|\.then.*fetch\|fetch('" src/` — must return no results. Run `pnpm test` — all tests must pass.

---

## Phase 4: User Story 2 — Consistent Error Handling (Priority: P2)

**Goal**: Replace all manual `if (!res.ok)` checks in non-streaming call sites with wretch's typed error handling. Non-OK responses for non-streaming calls must propagate as `WretchError` with consistent shape.

**Independent Test**: Using MSW, make `GET /api/tags` return a 500 and verify `ollamaWretch` throws a `WretchError` with `status === 500`. Make a 404 handler and verify it does not trigger a retry. All `if (!response.ok)` boilerplate must be removed from non-streaming call sites.

### Implementation for User Story 2

- [ ] T018 [US2] Update `src/lib/http/ollama-client.ts` — add `.resolve(w => w.internalError(err => { throw err }).fetchError(err => { throw err }))` on the base instance so all non-streaming calls throw `WretchError` for 5xx and network errors by default; document that 4xx pass through and callers handle them (consistent with current `if (!showRes.ok)` pattern)
- [ ] T019 [P] [US2] Update `src/lib/http/app-client.ts` — add matching `.resolve(...)` error defaults as T018 for consistency
- [ ] T020 [P] [US2] Verify `src/pages/api/ollama/models.ts` — confirm no `if (!res.ok)` remains after T010 migration; confirm the outer `try/catch` catches `WretchError` from `.json<T>()` and returns the same fallback `{ models: [] }` response as before; add an inline comment documenting this error-handling contract
- [ ] T021 [P] [US2] Verify `src/pages/api/ollama/model.ts` — confirm no `if (!showRes.ok)` remains after T011 migration; confirm the outer `try/catch` catches `WretchError` from either `.json<T>()` call in the `Promise.all` and returns `{ details: null, model }`; add an inline comment documenting this contract
- [ ] T022 [US2] Write `src/__tests__/lib/http/ollama-client.test.ts` — using MSW override handlers, test: (a) 500 response throws `WretchError`, (b) 4xx response does NOT trigger retry (max 1 attempt), (c) network error triggers up to 3 retry attempts, (d) successful GET returns parsed response
- [ ] T023 [US2] Write `src/__tests__/lib/http/app-client.test.ts` — using MSW override handlers, test: (a) 500 response throws `WretchError`, (b) 4xx is not retried, (c) successful POST with object body sends correct `Content-Type: application/json`, (d) `.query()` correctly appends URL params

**Checkpoint**: Run `pnpm test` — T022 and T023 tests must pass. Run `grep -r "if (!.*\.ok)" src/` — must return no results in non-streaming call sites.

---

## Phase 5: User Story 3 — Fluent Request Composition (Priority: P3)

**Goal**: Verify and validate all fluent composition patterns are correct: query params use `.query()`, POST objects are auto-serialized (no manual `JSON.stringify`), and a new call site can be added using only the shared clients with no boilerplate.

**Independent Test**: Add a new call to an existing MSW handler using only `appWretch` with no `fetch`, `JSON.stringify`, or `new Headers()` — verify it returns the correct response in a test.

### Implementation for User Story 3

- [ ] T024 [P] [US3] Verify zero `JSON.stringify` remains in migrated call sites — run `grep -n "JSON.stringify" src/pages/api/ollama src/components src/lib/services`; result must be empty (T011 removed it from model.ts POST body, T015–T017 removed it from component/service files); fix any stray occurrences found
- [ ] T025 [P] [US3] Verify zero manual `encodeURIComponent` remains in query strings — run `grep -n "encodeURIComponent" src/components/model/settings`; result must be empty (T013/T014 migrated to `.query()`); fix any stray occurrences found
- [ ] T026 [US3] Extend `src/__tests__/lib/http/app-client.test.ts` — add a test that demonstrates a new call using `appWretch.url('/api/ollama/models').query({ baseUrl: 'http://localhost:11434' }).get().json()` returns the correct response via MSW, with no `fetch`, `JSON.stringify`, or manual headers in the test or client code

**Checkpoint**: Run `grep -r "JSON.stringify" src/lib/http src/components/model/settings src/lib/services` — must return no results. Run `pnpm test` — all tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and zero-regression confirmation.

- [ ] T027 Run `pnpm test` — confirm full test suite passes with zero failures
- [ ] T028 [P] Run `pnpm run lint` — confirm no linting errors introduced by the migration
- [ ] T029 [P] Run `grep -rn "await fetch(" src/` — must return zero results; fix any stray occurrences found
- [ ] T030 [P] Run `grep -rn "\.then.*response\.json\|\.then.*res\.json" src/` — must return zero results (all `.then(r => r.json())` chains replaced by `.json<T>()` terminal)
- [ ] T031 Remove the `as const` type assertions or `as Promise<...>` casts left behind from `.then(r => r.json() as Promise<...>)` patterns if any remain after migration
- [ ] T032 [P] Verify FR-008 (override defaults) — add a JSDoc comment in `src/lib/http/app-client.ts` and `src/lib/http/ollama-client.ts` demonstrating how a call site can override shared defaults for an external URL: `appWretch.url('https://external.api/v1').options({ credentials: 'include' }).get().json()`; confirm this pattern compiles and does not modify the shared instance
- [ ] T033 [P] Verify SC-005 (boilerplate reduction) — spot-check 3 representative migrated files (`route.service.ts`, `use-installed-models.ts`, `models.ts`); confirm each migrated version has equal or fewer lines than the original; document the comparison in a code review comment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001–T003) — blocks all user stories
- **US1 (Phase 3)**: Depends on Phase 2 complete (T004–T009)
- **US2 (Phase 4)**: Depends on Phase 3 complete (T010–T017)
- **US3 (Phase 5)**: Depends on Phase 3 complete; can run in parallel with US2
- **Polish (Phase 6)**: Depends on all desired user story phases complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Starts after Phase 3 (US1) — builds on migrated call sites
- **US3 (P3)**: Starts after Phase 3 (US1) — can run concurrently with US2

### Within Each User Story

- Foundational client files (T004, T005) before any call site migration
- MSW handlers (T006–T009) before test tasks (T022, T023, T026)
- Server-side migrations (T010–T012) all parallel — different files
- Client-side migrations (T013–T017) all parallel — different files
- Error handling client updates (T018, T019) before call site updates (T020, T021)

### Parallel Opportunities

| Phase | Parallel group |
|---|---|
| Phase 2 | T005, T006, T007, T008, T009 (all after T004) |
| Phase 3 | T010, T011, T012, T013, T014, T015, T016, T017 (all 8 simultaneously) |
| Phase 4 | T019 with T018; T020, T021 after T018+T019 |
| Phase 5 | T024, T025 simultaneously |
| Phase 6 | T028, T029, T030, T031, T032, T033 simultaneously |

---

## Parallel Example: User Story 1

```bash
# All 8 call site migrations can run simultaneously (different files):
Task T010: Migrate src/pages/api/ollama/models.ts
Task T011: Migrate src/pages/api/ollama/model.ts
Task T012: Migrate src/pages/api/ollama/pull.ts
Task T013: Migrate src/components/model/settings/use-installed-models.ts
Task T014: Migrate src/components/model/settings/use-runtime-model-details.ts
Task T015: Migrate src/components/chat/TranslateButton.tsx
Task T016: Migrate src/components/model/settings/use-model-pull.ts
Task T017: Migrate src/lib/services/route.service.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T009) — **BLOCKS everything**
3. Complete Phase 3: User Story 1 (T010–T017)
4. **STOP and VALIDATE**: `grep -r "await fetch(" src/` returns empty; `pnpm test` passes
5. Deploy/demo: all API routes and React hooks use wretch; app functions identically

### Incremental Delivery

1. Setup + Foundational → two shared clients exist, MSW wired up
2. US1 → all 8 call sites migrated, zero raw fetch → **MVP**
3. US2 → consistent error handling, tests covering error paths
4. US3 → verified fluent composition, no JSON.stringify boilerplate
5. Polish → full lint + test pass, clean grep checks

### Parallel Team Strategy

With multiple developers (after Phase 2 complete):

- **Developer A**: T010, T011, T012 (server-side API routes)
- **Developer B**: T013, T014, T015, T016, T017 (client-side components + services)
- Stories complete and integrate cleanly — different files, no conflicts

---

## Notes

- `[P]` tasks target different files with no shared in-progress dependencies
- Streaming call sites (pull.ts, TranslateButton.tsx, use-model-pull.ts, route.service.ts) use `.res()` — all body-reading code after `.res()` is unchanged
- Non-streaming call sites use `.json<T>()` which auto-throws on non-OK (WretchError)
- wretch `.post(plainObject)` automatically sets `Content-Type: application/json` and serializes — remove all manual `JSON.stringify` + header setup
- `AbortSignal.timeout(ms)` passed via `.signal()` — no behavior change for callers
- MSW `onUnhandledRequest: 'error'` will catch any test that forgets to register a handler — treat as a test failure to fix, not suppress
