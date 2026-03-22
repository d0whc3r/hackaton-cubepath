# Tasks: Intelligent SLM Router for Developer Tasks

**Input**: Design documents from `/specs/001-slm-router-dev-tasks/`
**Prerequisites**: plan.md ✓ spec.md ✓ research.md ✓ data-model.md ✓ contracts/api-route.md ✓

---

## Phase 1: Setup

**Purpose**: Install tooling and create shared types. No feature code yet.

- [X] T001 Install AI SDK packages: `pnpm add ai @ai-sdk/openai`
- [X] T002 [P] Install test packages: `pnpm add -D vitest happy-dom @testing-library/react @testing-library/user-event vite-tsconfig-paths`
- [X] T003 [P] Create `vitest.config.ts` at project root (environment: happy-dom, include: `src/__tests__/**/*.test.{ts,tsx}`)
- [X] T004 [P] Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `package.json`
- [X] T004b [P] Create `Dockerfile` — multi-stage Node 24 alpine build; stages: deps → build (`pnpm build`) → runtime (`node ./dist/server/entry.mjs`); expose port 4321
- [X] T004c [P] Create `docker-compose.yml` — two services: `app` (build from Dockerfile, port 4321, env `OLLAMA_BASE_URL=http://ollama:11434`, `OLLAMA_EXPLAIN_MODEL=phi3.5`, `OLLAMA_CODE_MODEL=qwen2.5-coder:7b`) and `ollama` (image `ollama/ollama`, port 11434, volume `ollama_data`, healthcheck via `ollama list`); `app` depends on `ollama` healthy
- [X] T004d [P] Create `.env.example` — document all required env vars: `OLLAMA_BASE_URL`, `OLLAMA_EXPLAIN_MODEL`, `OLLAMA_CODE_MODEL`, `HOST`, `PORT` with their defaults; verify `.env` is listed in `.gitignore` (add if missing)
- [X] T005 Create `src/lib/router/types.ts` — export `TaskType`, `DetectedLanguage`, `SpecialistConfig`, `RoutingDecision`, `RoutingStep`, `CostEstimate` as defined in `data-model.md`

**Checkpoint**: `pnpm test` runs (zero tests, no errors). Types compile clean. `docker compose up --build` starts without errors (app + ollama containers running). Note: `/api/route` will fail until models are pulled in T014 — that is expected at this stage.

---

## Phase 2: Foundational Core

**Purpose**: Core infrastructure shared by ALL user stories. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Completes the router pipeline and full UI shell. Each user story then only adds a specialist config entry + tests + verification.

### Language Detector

- [X] T007 Create `src/__tests__/lib/router/detector.test.ts` — write tests before implementation; cover ≥10 language patterns + "unknown" fallback + empty input; tests must fail before T006 is implemented
- [X] T006 Create `src/lib/router/detector.ts` — `detectLanguage(input: string): DetectedLanguage` using heuristic pattern matching for TypeScript, JavaScript, Python, Rust, Go, Java, C/C++, Ruby, Swift, Kotlin; default `"unknown"`; run tests after implementation and confirm they pass

### Router & Cost

- [X] T008 Create `src/lib/router/specialists.ts` — export `buildSpecialists(env: { explainModel: string; codeModel: string }): Record<TaskType, SpecialistConfig>` with 4 independent entries (explain, test, refactor, commit); `explain` uses `env.explainModel` (`phi3.5`), others use `env.codeModel` (`qwen2.5-coder:7b`); each entry has distinct `id`, `displayName`, and `buildSystemPrompt(language, input)`; system prompts are stubs at this stage
- [X] T010 Create `src/__tests__/lib/router/router.test.ts` — write tests before implementation; tests call `route(taskType, input, specialists)` with a test-double specialists map (built via `buildSpecialists({ explainModel: "phi3.5", codeModel: "qwen2.5-coder:7b" })`); assert correct specialist + detected language in returned `RoutingDecision`; tests must fail before T009 is implemented
- [X] T009 Create `src/lib/router/index.ts` — export `route(taskType: TaskType, input: string, specialists: Record<TaskType, SpecialistConfig>): RoutingDecision`; calls `detectLanguage(input)`, looks up `specialists[taskType]`, calls `specialist.buildSystemPrompt(detectedLanguage, input)`, returns `RoutingDecision`; pure function, no AI call; run tests after implementation and confirm they pass
- [X] T012 Create `src/__tests__/lib/cost/calculator.test.ts` — write tests before implementation; cover token math, cost formula, 0-token edge case, savingsPct = 93 for standard inputs; tests must fail before T011 is implemented
- [X] T011 Create `src/lib/cost/calculator.ts` — export `estimateCost(inputChars: number, outputChars: number): CostEstimate`; tokens = `Math.ceil(chars / 4)`; specialist price = $0.000001/token, large model = $0.000015/token; compute `savingsPct`; run tests after implementation and confirm they pass

### API Route (SSE)

- [X] T013 Create `src/pages/api/route.ts` — `POST /api/route` SSE handler: read env vars (`OLLAMA_BASE_URL`, `OLLAMA_EXPLAIN_MODEL`, `OLLAMA_CODE_MODEL`); build specialists registry via `buildSpecialists({ explainModel, codeModel })`; validate input (empty, >8000 chars, invalid taskType → 400 JSON error with partition guide for INPUT_TOO_LARGE); call `route(taskType, input, specialists)`, emit `routing_step` events; call `streamText()` via `createOpenAI({ baseURL: OLLAMA_BASE_URL + "/v1", apiKey: "ollama" })` with `decision.specialist.modelId` and `decision.systemPrompt`; emit `response_chunk` events; on stream completion emit `cost`, `done`; on timeout (>15s) or stream error emit `event: interrupted` and close; follow SSE schema in `contracts/api-route.md` exactly (including the `interrupted` event)
- [ ] T014 Create `.env` from `.env.example`; pull models into local Ollama: `ollama pull phi3.5 && ollama pull qwen2.5-coder:7b`; start dev environment (`docker compose up` or `pnpm dev` + native Ollama)
- [ ] T015 Smoke test via curl (requires T014): `curl -N -X POST http://localhost:4321/api/route -H "Content-Type: application/json" -d '{"input":"function add(a,b){return a+b}","taskType":"explain"}'` — verify SSE event sequence ends with `event: done`

### UI Shell

- [X] T016 Create `src/components/App.tsx` — React island; state: `routingSteps`, `specialist`, `responseText`, `cost`, `isLoading`, `error`, `interrupted`, `history` (max 50 items); fetch POST `/api/route` with streaming body reader, parse SSE lines (`event:` / `data:`), dispatch to state; on `interrupted` event set interrupted state and preserve any partial `responseText`; expose a cancel callback that aborts the fetch and sets interrupted state; expose edit+resend from history; compose TaskPanel + RoutingPanel + ResponsePanel + CostBadge + HistoryPanel
- [X] T017 [P] Create `src/components/TaskPanel.tsx` — 4-option task type selector (tab strip: Explain / Generate Tests / Refactor / Write Commit) + single `<textarea>` + Submit button (disabled while `isLoading`) + Cancel button (visible and enabled while `isLoading`); calls `onSubmit(input, taskType)` and `onCancel()` props
- [X] T018 [P] Create `src/components/RoutingPanel.tsx` — renders 4 `RoutingStep` items as a vertical list; each item shows icon + label + status (spinner = active, check = done, x = error); updates as `routing_step` SSE events arrive; shows specialist badge + language chip after `specialist_selected`
- [X] T019 [P] Create `src/components/ResponsePanel.tsx` — append-only text as `response_chunk` events arrive; header badge shows specialist `displayName`; shows placeholder when empty; shows error message on error state; shows "interrupted — partial output below" notice when interrupted; includes a Copy button that copies the response text only (not input)
- [X] T020 [P] Create `src/components/CostBadge.tsx` — renders after `cost` event; shows specialist cost (USD), large-model cost (USD), savings % with green highlight; always shows "estimated" label; hidden until `cost` received
- [X] T021 Update `src/pages/index.astro` — import and mount `<App client:load />` inside the page body; remove placeholder content
- [X] T021b [P] Create `src/components/HistoryPanel.tsx` — renders up to 10 most recent session history items with a "Load more" button to reveal older ones (max 50 total); each item shows task type, truncated input, and a "Re-use" button that calls `onReuse(input, taskType)` to populate the input area; visible only when history is non-empty
- [X] T022 [P] Create `src/__tests__/components/TaskPanel.test.tsx` — renders 4 task buttons; submit calls onSubmit with correct args; submit is disabled when isLoading=true; cancel button visible when isLoading=true; cancel calls onCancel
- [X] T023 [P] Create `src/__tests__/components/RoutingPanel.test.tsx` — renders step labels; active step shows spinner; done step shows checkmark; error/interrupted step shows error indicator; specialist badge appears after specialist_selected
- [X] T024 [P] Create `src/__tests__/components/ResponsePanel.test.tsx` — renders streamed text; shows specialist displayName in header; shows error message when error prop set; shows interrupted notice when interrupted prop set; copy button copies response text only
- [X] T025 [P] Create `src/__tests__/components/CostBadge.test.tsx` — hidden when no cost; renders specialist cost, large-model cost, savings %; always shows "estimated" text
- [X] T025b [P] Create `src/__tests__/components/HistoryPanel.test.tsx` — hidden when history is empty; renders up to 10 items by default; "Load more" button appears when history > 10 items; re-use button calls onReuse with correct input and taskType

**Checkpoint**: `pnpm test` passes all foundational tests. UI renders in browser with cancel button and session history visible. Curl smoke test returns a full SSE event stream including `interrupted` on abort. No user story specialist prompts are complete yet — all 4 task types route but produce generic output.

---

## Phase 3: US1 — Explain Code (Priority: P1) 🎯 MVP

**Goal**: A developer pastes code, selects "Explain", and receives a clear natural-language explanation with animated routing panel and cost comparison.

**Independent Test**: Paste `function add(a, b) { return a + b }`, select Explain, verify animated panel completes and a plain-language explanation appears with a cost badge.

### Tests (write first, verify they fail)

- [X] T026 [US1] Create `src/__tests__/lib/router/specialists.test.ts` — first test: `explain` entry from `buildSpecialists(env)` has id `explanation-specialist`; calling `buildSystemPrompt(mockLang, "function f(){}")` returns a string that: (a) contains "explain" and the language name, (b) instructs plain text output with no markdown, (c) mentions the four fixed sections (What it does, Why it works, Example, Risks); does NOT contain code transformation instructions; test must fail before T027 is implemented

### Implementation

- [X] T027 [US1] Complete `buildSystemPrompt` for `explanation-specialist` in `src/lib/router/specialists.ts` — system prompt instructs: output plain text only (no markdown, no code blocks), explain in the fixed order "What it does / Why it works / Example / Risks", adapt depth to code complexity, mention the detected language, address a senior developer audience
- [X] T028 [US1] Verify smoke test for explain task type: `curl ... -d '{"input":"...","taskType":"explain"}'` returns a plain-language explanation in response_chunk events

**Checkpoint**: US1 fully functional — animated panel, explanation response, cost badge. Demo-able as MVP.

---

## Phase 4: US2 — Generate Tests (Priority: P2)

**Goal**: A developer submits a function, selects "Generate Tests", and receives test cases covering happy path and at least one edge case.

**Independent Test**: Submit a simple function, select Generate Tests, verify formatted test cases are returned that cover primary behaviors.

### Tests (write first, verify they fail)

- [X] T029 [US2] Add to existing `src/__tests__/lib/router/specialists.test.ts` — `test` entry has id `test-specialist`; `buildSystemPrompt("typescript", input)` output instructs use of Vitest; `buildSystemPrompt("python", input)` output instructs use of pytest; `buildSystemPrompt("unknown", input)` output instructs pseudocode only; prompt specifies two output sections (executable tests + pseudocode edge cases); no markdown in output; test must fail before T030 is implemented

### Implementation

- [X] T030 [US2] Complete `buildSystemPrompt` for `test-specialist` in `src/lib/router/specialists.ts` — system prompt instructs: output plain text only (no markdown); section 1: executable tests using the framework for the detected language (Vitest for TS/JS, pytest for Python, testing package for Go, JUnit for Java, built-in tests for Rust); section 2: pseudocode for additional edge/error cases; if language is unknown, output pseudocode only
- [X] T031 [US2] Verify smoke test for test task type: submit a TypeScript function, confirm response contains two sections (executable Vitest tests + pseudocode edge cases) and no markdown syntax

**Checkpoint**: US2 functional. Both Explain and Generate Tests work end-to-end independently.

---

## Phase 5: US3 — Refactor Code (Priority: P3)

**Goal**: A developer submits code, selects "Refactor", and receives an improved version with a brief summary of changes.

**Independent Test**: Submit a nested conditional block, select Refactor, verify refactored code is returned alongside a summary of changes.

### Tests (write first, verify they fail)

- [X] T032 [US3] Add to existing `src/__tests__/lib/router/specialists.test.ts` — `refactor` entry has id `refactor-specialist`; `buildSystemPrompt(mockLang, "function f(){}")` output: (a) instructs plain text output, no markdown; (b) instructs legibility-first refactoring; (c) requires the response to end with the literal line "Behavior preserved: yes|no - <note>"; does NOT contain explanation-style instructions; test must fail before T033 is implemented

### Implementation

- [X] T033 [US3] Complete `buildSystemPrompt` for `refactor-specialist` in `src/lib/router/specialists.ts` — system prompt instructs: output plain text only (no markdown, no code blocks); prioritize legibility over performance; preserve the original behavior by default; use idiomatic patterns for the detected language; end the response with exactly: "Behavior preserved: yes|no - <short note>"
- [X] T034 [US3] Verify smoke test for refactor task type: submit a function with a known code smell, confirm response ends with "Behavior preserved:" line and contains no markdown syntax

**Checkpoint**: US3 functional. Explain, Generate Tests, and Refactor all work independently.

---

## Phase 6: US4 — Write Commit Message (Priority: P4)

**Goal**: A developer pastes a diff or change description, selects "Write Commit", and receives a plain-text commit message (2 lines max, no conventional commit format).

**Independent Test**: Paste a short git diff, select Write Commit, verify the response is at most 2 lines and does NOT start with a conventional commit type prefix (e.g., no `fix:`, `feat:`, `chore:`).

### Tests (write first, verify they fail)

- [X] T035 [US4] Add to existing `src/__tests__/lib/router/specialists.test.ts` — `commit` entry has id `commit-specialist`; `buildSystemPrompt(mockLang, "diff --git a/f.ts...")` returns a prompt that: (a) detects diff input and instructs deriving message from code changes, (b) explicitly forbids conventional commit format, (c) limits output to 2 lines max; `buildSystemPrompt(mockLang, "added null check to user validator")` returns a prompt that: (a) detects prose input and derives from described intent, (b) also forbids conventional commit format; when input contains multiple logical changes, prompt instructs adding a split suggestion in line 2; test must fail before T036 is implemented

### Implementation

- [X] T036 [US4] Complete `buildSystemPrompt` for `commit-specialist` in `src/lib/router/specialists.ts` — detect whether input is a diff (starts with `diff --git` or `@@`) vs. prose description; if diff: instruct model to derive message from actual code changes; if prose: derive from stated intent; always: output plain text only, at most 2 lines (line 1 = short title, line 2 = optional brief description), must NOT use conventional commit format (no `type:` prefix); if multiple logical changes detected in diff, include a brief split suggestion in line 2
- [X] T037 [US4] Verify smoke test for commit task type: submit a short git diff, confirm response is ≤2 lines, contains no conventional commit prefix, and accurately reflects the change

**Checkpoint**: All 4 user stories functional and independently testable.

---

## Phase 7: Polish & Demo Readiness

**Purpose**: Error handling, visual quality, and demo confidence. Affects all user stories.

- [X] T038 [P] Add error handling in `src/pages/api/route.ts` — emit `event: error` with user-friendly message if `streamText()` throws before streaming begins (e.g., model not found, connection refused); emit `event: interrupted` if the stream is cut mid-flight (timeout >15s, network drop); emit `event: interrupted` on client-side cancel (AbortController signal)
- [X] T039 [P] Add client-side error display in `src/components/App.tsx` — on `error` SSE event, set error state; `ResponsePanel` renders the error message; RoutingPanel marks last active step as errored
- [X] T040 [P] Add input validation feedback in `src/components/TaskPanel.tsx` — disable submit if textarea is empty; show live char count; show warning at 7500 chars (approaching limit); on submit attempt with >8000 chars, show inline rejection notice with a short partition guide ("Split your input into smaller parts and submit each separately") instead of sending the request
- [X] T041 Polish `src/components/RoutingPanel.tsx` — smooth CSS transitions between step states; step items animate in sequentially on first render; specialist badge fades in
- [X] T042 [P] Ensure responsive layout in `src/pages/index.astro` and `src/components/App.tsx` — usable on laptop screen at 1280px+ width; panels stack vertically on narrow screens
- [X] T043 Run `pnpm test` — all tests pass
- [X] T044 [P] Run `pnpm type-check` — zero TypeScript errors
- [X] T045 [P] Run `pnpm lint` — zero lint errors
- [ ] T046 Routing accuracy check (SC-002): run ≥12 requests per task type (≥50 total) with varied real code samples; for each request verify all three routing contract conditions: (1) task type maps to the correct specialist badge shown in the routing panel, (2) commit input mode (diff vs. prose) is correctly identified when applicable, (3) detected language shown in panel is reasonable for the input; document any failures; target ≥95% of requests passing all three conditions simultaneously
- [ ] T047 Demo run: manually exercise all 4 task types with realistic code samples; verify animated routing panel, correct specialist badge, coherent response, and cost badge on every request

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundation)**: Depends on Phase 1 — **blocks all user stories**
- **Phases 3–6 (User Stories)**: Depend on Phase 2; can proceed sequentially P1→P2→P3→P4 or in parallel if staffed
- **Phase 7 (Polish)**: Depends on all desired user stories complete

### Within Phase 2

Tasks T006–T012 (router + cost) can start once T005 (types) is done.
Tasks T016–T025 (UI) can start once T013–T015 (API route) are verified.
All `[P]` tasks within a group have no file conflicts.

### Within Each User Story Phase (3–6)

Test task → write and confirm failure → implement specialist prompt → verify smoke test.

### Parallel Opportunities

- T001, T002, T003, T004, T004b, T004c, T004d all parallel (different files)
- T007 → T006, T010 → T009, T012 → T011: test file precedes its implementation (TDD order — not parallel)
- T017, T018, T019, T020, T021b (UI components) all parallel
- T022, T023, T024, T025, T025b (component tests) all parallel
- T038, T039, T040 (polish) all parallel
- T043, T044, T045 (quality gates) all parallel

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 + Phase 2
2. Complete Phase 3 (US1 — Explain)
3. **STOP**: demo Explain end-to-end — animated panel, explanation, cost badge
4. Continue to US2, US3, US4 incrementally

### Full Sequential

Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → Polish

Each phase adds one working task type without breaking previous ones.

---

## Notes

- `[P]` = different files, no shared state — safe to work in parallel
- `[USN]` = traces task to user story for independent validation
- Tests marked with a story label are scoped to that story's specialist only
- Write tests before implementation — confirm red before green
- Commit after each checkpoint
- The specialist system prompts are the highest-leverage work — invest time in them
