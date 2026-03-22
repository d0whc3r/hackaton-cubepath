# Tasks: Code Quality & Refactor

**Input**: Design documents from `/specs/002-code-quality-refactor/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/hooks-api.md ✅ quickstart.md ✅

**Tests**: Included — spec.md FR-008 and SC-004 explicitly require new unit tests for every extracted hook and utility.

**Organization**: Tasks grouped by user story and delivery slice to enable independent, verifiable increments.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story label (US1–US4)
- All paths are relative to repo root

---

## Phase 1: Setup (Baseline Validation)

**Purpose**: Confirm all tests, lint, and build pass before any changes. Establishes green baseline.

- [X] T001 Run `pnpm test && pnpm lint && pnpm build` and confirm all pass — record any pre-existing warnings as known issues (not to be introduced by this refactor)
- [X] T002 Search `grep -rn "useCallback\|useMemo" src/` and record all locations — this list defines the complete removal scope for Phase 2

**Checkpoint**: Baseline green. Known pre-existing issues documented.

---

## Phase 2: Foundational — React Compiler & Quality Gates (Blocking)

**Purpose**: Install React Compiler, configure it in build and test toolchain, enforce complexity rule, and remove all manual memoisation. **Must complete before any user story work.**

⚠️ **CRITICAL**: No US1/US2/US3/US4 work begins until this phase is complete and verified.

- [X] T003 Add `babel-plugin-react-compiler` as devDependency: `pnpm add -D babel-plugin-react-compiler` in `package.json`
- [X] T004 [P] Configure React Compiler in `astro.config.ts`: add `babel: { plugins: [['babel-plugin-react-compiler']] }` to the `react()` integration options
- [X] T005 [P] Configure React Compiler in `vitest.config.ts`: add `babel: { plugins: [['babel-plugin-react-compiler']] }` to the `react()` plugin options (mirrors astro config so tests compile with the compiler too)
- [X] T006 [P] Add quality gates to `oxlint.config.ts`: add `"complexity": ["error", 5]` and `"max-depth": ["error", 3]` under `rules` (`max-depth` enforces the ≤3 nesting levels specified in the US1 Independent Test criterion) — run `pnpm lint` to identify any existing violations before proceeding
- [X] T007 Remove the `useMemo` wrapping the `activeModelInstalled` derived value in `src/components/model/settings/use-model-config-page.ts` — the React Compiler handles this automatically
- [X] T008 [P] Remove `useCallback` wrappers from `updateLastAssistant`, `handleSubmit`, `handleCancel`, and `handleClearHistory` in `src/components/chat/ChatContainer.tsx` — the React Compiler handles memoisation automatically
- [X] T009 Verify after T003–T008: `pnpm build` succeeds with React Compiler active; `pnpm test` passes; `pnpm lint` passes with complexity rule active

**Checkpoint**: React Compiler installed and active. All manual memoisation removed. Complexity gate enforced. User story implementation can begin.

---

## Phase 3: User Story 1 — Component Decomposition (Priority: P1) 🎯 MVP

**Goal**: Extract all non-rendering logic from `ChatContainer` and `ChatInput` into dedicated hooks; both components become pure rendering units.

**Independent Test**: Each extracted hook has passing unit tests; `ChatContainer` and `ChatInput` source files contain zero state management logic, zero API calls, and zero business logic — only JSX and hook invocations.

### Tests for User Story 1

> Write these tests FIRST. They will fail until the hooks are implemented.

- [X] T010 [P] [US1] Create test file `src/__tests__/hooks/use-chat-session.test.ts` — write tests covering: initial state from `loadHistory`, `handleSubmit` appends streaming entry, `handleCancel` sets interrupted status, `handleClearHistory` empties entries, `saveHistory` side-effect called on entries change, `fixedTaskType` locks `activeTask`
- [X] T011 [P] [US1] Create test file `src/__tests__/hooks/use-chat-input.test.ts` — write tests covering: `overLimit` true when input > 8000 chars, `onSubmit` no-op when empty/overLimit/loading, `onKeyDown` triggers submit only on Cmd+Enter or Ctrl+Enter, `modelLabel` falls back to raw model string when label not found
- [X] T012 [P] [US1] Create test file `src/__tests__/hooks/use-file-attachment.test.ts` — write tests covering: `onFileChange` reads file as text and calls `onContent` with sliced content, `onFileChange` resets input value after reading, `removeFile` clears filename and calls `onContent` with empty strings, no-op when no file selected

### Implementation for User Story 1

- [X] T013 [US1] Create `src/hooks/use-chat-session.ts` — extract from `ChatContainer`: all `useState` declarations (entries, activeTask), `useEffect` for `saveHistory`, `useRef` for `abortRef`, `useMutation` call, `updateLastAssistant` callback, `mergeRoutingStep` helper (move to this module), `handleSubmit`, `handleCancel`, `handleClearHistory`. Export `UseChatSessionReturn` interface matching contract in `contracts/hooks-api.md`
- [X] T014 [US1] Create `src/hooks/use-chat-input.ts` — extract from `ChatInput`: `displayTask` derivation, `currentOption` derivation, `charCount`, `overLimit`, `modelLabel` derivation, `onSubmit` function, `onKeyDown` function. Consumes `useChatContext`. Export `UseChatInputReturn` interface
- [X] T015 [US1] Create `src/hooks/use-file-attachment.ts` — extract from `ChatInput`: `attachedFileName` state, `fileInputRef`, `onFileChange` (FileReader logic), `removeFile`. Accept `onContent: (content: string, fileName: string) => void` and `maxChars: number` parameters. Export `UseFileAttachmentReturn` interface
- [X] T016 [US1] Simplify `src/components/chat/ChatContainer.tsx` — replace all extracted logic with `useChatSession(fixedTaskType)` invocation; component body becomes context provider setup + `<ChatMessages /><ChatInput />` composition only; remove `mergeRoutingStep` (now in hook); remove unused imports
- [X] T017 [US1] Simplify `src/components/chat/ChatInput.tsx` — replace extracted logic with `useChatInput(input, setInput)` and `useFileAttachment(...)` invocations; retain only `useState` for `input` (local UI state); component body becomes pure JSX consuming hook return values
- [X] T018 [US1] Run `pnpm test src/__tests__/hooks/` — all 3 new hook test files must pass; run `pnpm lint src/hooks/` — zero violations including complexity ≤ 5

### Implementation for User Story 1 — API Route Decomposition (Cyclomatic Complexity)

> `buildSSEStream` in `route.ts` has ~100 lines mixing language detection, task analysis, specialist selection, and streaming. Decomposing into named single-responsibility functions reduces its cyclomatic complexity to ≤ 5. All tasks modify the same file — run sequentially.

- [X] T031 [US1] Extract `emitLanguageDetection(decision: RoutingDecision, emit: SseEmitter): void` from `buildSSEStream` in `src/pages/api/route.ts` — emits the language detection routing step event; no async, no side effects beyond the emit call
- [X] T032 [US1] Extract `emitTaskAnalysis(taskType: TaskType, emit: SseEmitter): void` from `buildSSEStream` in `src/pages/api/route.ts` — emits the task analysis routing step event
- [X] T033 [US1] Extract `emitSpecialistSelection(decision: RoutingDecision, emit: SseEmitter): void` from `buildSSEStream` in `src/pages/api/route.ts` — emits the specialist selection routing step event
- [X] T034 [US1] Extract `streamSpecialistResponse(ollama, decision, input, systemPrompt, emit, signal): Promise<void>` from `buildSSEStream` in `src/pages/api/route.ts` — handles primary stream + token-limit continuation + 5-minute timeout + abort handling + cost emission; KEEP the "Auto-continue" comment (explains token-limit business decision) and add reasoning to the "5 min" timeout comment (specialist models on consumer hardware can be slow for large inputs)
- [X] T035 [US1] Reduce `buildSSEStream` to a pure orchestrator in `src/pages/api/route.ts` — body becomes sequential calls to `emitLanguageDetection`, `emitTaskAnalysis`, `emitSpecialistSelection`, then `streamSpecialistResponse`; run `pnpm lint src/pages/api/route.ts` — cyclomatic complexity of `buildSSEStream` must be ≤ 5

**Checkpoint**: US1 complete. `ChatContainer` and `ChatInput` are pure rendering components. 3 new hooks with passing tests. `buildSSEStream` decomposed into 4 named single-responsibility functions. `pnpm test && pnpm lint && pnpm build` all green.

---

## Phase 4: User Story 2 — Custom Hooks & Reusable Utils (Priority: P2)

**Goal**: Extract duplicated and misplaced utilities into their canonical locations: model config logic out of `ModelConfigDialog`, `resolveModel` out of both API route handlers, `ollamaClient` usage deduplicated in `analyst.ts`.

**Independent Test**: `src/lib/config/model-config.ts` and `src/lib/api/resolve-model.ts` have passing unit tests; `ModelConfigDialog.tsx` exports only the nav button component; `analyst.ts` imports `ollamaClient` from `src/lib/api/sse.ts`; `grep -rn "resolveModel" src/pages/` returns zero inline definitions.

### Tests for User Story 2

> Write these tests FIRST.

- [X] T019 [P] [US2] Create test file `src/__tests__/lib/config/model-config.test.ts` — write tests covering: `loadModelConfig` returns DEFAULTS on SSR (window undefined), `loadModelConfig` merges stored values over DEFAULTS, `loadModelConfig` returns DEFAULTS on JSON parse error, `getModelForTask` returns correct key per TaskType, all getter functions return expected values
- [X] T020 [P] [US2] Create test file `src/__tests__/lib/api/resolve-model.test.ts` — write tests covering: returns `fromBody.trim()` when non-empty, skips `fromBody` and returns `envVar.trim()` when body empty/undefined, returns `fallback` when both empty/undefined, handles whitespace-only strings correctly

### Implementation for User Story 2

- [X] T021 [US2] Create `src/lib/config/model-config.ts` — move from `src/components/model/ModelConfigDialog.tsx`: `ModelConfig` interface, `DEFAULTS`, `STORAGE_KEY`, `TASK_MODEL_KEY`, `loadModelConfig`, `getModelForTask`, `getAnalystModel`, `getTranslateModel`. Keep only `ModelConfigDialog` component in the original file
- [X] T022 [US2] Update `src/components/model/ModelConfigDialog.tsx` — remove all exported utilities (moved to T021); retain only the `ModelConfigDialog` component and its `Settings` icon import; add import from `src/lib/config/model-config.ts` if component itself needs any config value
- [X] T023 [P] [US2] Update `src/components/chat/ChatContainer.tsx` — replace import `from '@/components/model/ModelConfigDialog'` with `from '@/lib/config/model-config'` for `loadModelConfig`, `getModelForTask`, `getAnalystModel`
- [X] T024 [P] [US2] Update `src/components/model/settings/use-persisted-model-config.ts` (or whichever settings hooks import from ModelConfigDialog) — update import paths to `src/lib/config/model-config`
- [X] T025 [P] [US2] Audit all files that import from `@/components/model/ModelConfigDialog` and update to `@/lib/config/model-config` for utility imports — run `grep -rn "from.*ModelConfigDialog" src/` to find all consumers
- [X] T026 [US2] Create `src/lib/api/resolve-model.ts` — extract the `resolveModel` function (identical in `route.ts` and `translate.ts`); add a "why" comment explaining the body → env → fallback priority order (request body overrides env for per-request flexibility without server restart)
- [X] T027 [US2] Update `src/pages/api/route.ts` — remove local `resolveModel` definition; import from `src/lib/api/resolve-model`
- [X] T028 [P] [US2] Update `src/pages/api/translate.ts` — remove local `resolveModel` definition; import from `src/lib/api/resolve-model`
- [X] T029 [US2] Update `src/lib/router/analyst.ts` — remove inline `createOpenAI({ apiKey: 'ollama', baseURL: ... })` creation; import `ollamaClient` from `src/lib/api/sse.ts` and call `ollamaClient(baseUrl)` instead; this eliminates the duplicated client factory
- [X] T030 [US2] Run `pnpm test src/__tests__/lib/` — all new utility tests must pass; `pnpm lint` zero violations; verify `grep -rn "resolveModel" src/pages/` returns zero inline function definitions

**Checkpoint**: US2 complete. Config utilities in `src/lib/config/`. `resolveModel` deduplicated. `ollamaClient` single creation point. `pnpm test && pnpm lint && pnpm build` all green.

---

## Phase 5: User Story 3 — Performance Improvements via React Compiler (Priority: P3)

**Goal**: Verify React Compiler is correctly applied across all refactored components and confirm no component re-renders unnecessarily due to context shape. (Note: `buildSSEStream` decomposition for cyclomatic complexity is handled in Phase 3/US1 as T031–T035.)

**Independent Test**: `pnpm build` produces no compiler warnings; `grep -rn "useCallback\|useMemo" src/` returns zero results; all components pass the `complexity` and `max-depth` lint rules.

### Implementation for User Story 3

- [X] T036 [US3] Audit React Context shape in `src/lib/context/chat-context.ts` — verify the `ChatContextValue` interface is not unnecessarily wide; if any component consumes only stable values (`fixedTaskType`, `currentModel`) and not `entries`/`isLoading`, add a Vitest test using `@testing-library/react` `renderHook` that verifies the component does not re-render when `entries` changes (assert render count = 1 after `entries` mutation). If all consumers need all values, document this finding and close as N/A.
- [X] T037 [US3] Final compiler verification: run `grep -rn "useCallback\|useMemo" src/` — must return zero results; run `pnpm build` — must succeed without compiler diagnostics; run `pnpm test` — must pass

**Checkpoint**: US3 complete. React Compiler verified active. Complexity rule passes on all modified files. `pnpm test && pnpm lint && pnpm build` all green.

---

## Phase 6: User Story 4 — Comment Hygiene & Technical Documentation (Priority: P4)

**Goal**: Remove all noise comments (restating what the code does) from every modified file; add "why" documentation for non-obvious technical decisions.

**Independent Test**: `grep -rn "// [A-Z][a-z]" src/ --include="*.ts" --include="*.tsx"` returns zero inline section dividers or narrative comments; every remaining comment explains a decision, constraint, or non-obvious behaviour.

### Implementation for User Story 4

- [X] T038 [P] [US4] Comment hygiene in `src/components/chat/` — remove noise comments; review each file: `TaskApp.tsx` (remove `/* H-screen + overflow-hidden constrains the whole layout to viewport */` if self-evident; KEEP `/* Min-h-0 is critical: lets this flex child shrink below content height */` — explains non-obvious flexbox constraint); `ChatContainer.tsx`, `ChatMessages.tsx`, `AssistantBubble.tsx`, `UserBubble.tsx`, `RoutingProgress.tsx`, `EmptyState.tsx`, `TranslateButton.tsx`
- [X] T039 [P] [US4] Comment hygiene in `src/components/model/` — remove noise comments in `ModelConfigDialog.tsx`, `ModelConfigPage.tsx`, and all `settings/` files; keep comments that explain non-obvious model selection logic
- [X] T040 [P] [US4] Comment hygiene in `src/components/layout/` — review `AppSidebar.tsx`, `OverviewTaskCards.tsx`, `ThemeToggle.tsx`
- [X] T041 [P] [US4] Comment hygiene + side-effect documentation in `src/lib/utils/` — remove noise comments from `format.ts`, `history.ts`, `savings.ts`; per FR-003, add a `// Side effect: writes to localStorage` comment to `saveHistory` and `clearHistory` in `history.ts`, and to `addSaving` in `savings.ts`; add "why" comment explaining the localStorage key naming strategy if non-obvious
- [X] T042 [P] [US4] Comment hygiene in `src/lib/prompts/` — remove decorative section dividers (`// ── Step 1 ──`); add "why" documentation where LLM prompting decisions are non-obvious (e.g., why continuation prompt instructs "do not repeat anything already written")
- [X] T043 [US4] Technical documentation in `src/lib/api/sse.ts` — add JSDoc to `ollamaClient` explaining the Adapter pattern: why the Ollama HTTP API is accessed via the OpenAI SDK (Ollama exposes an OpenAI-compatible `/v1` endpoint, avoiding a separate Ollama SDK dependency); verify existing JSDoc on `createSseStream` is accurate and non-redundant
- [X] T044 [P] [US4] Technical documentation in `src/lib/router/analyst.ts` — the module-level JSDoc block is good; review for accuracy post-refactor; add inline "why" for `ANALYST_TIMEOUT_MS = 8000` (8 seconds balances cold-start latency for local models with user experience — fast enough to feel responsive, long enough for a first-run model load); remove any decorative divider comments
- [X] T045 [P] [US4] Technical documentation in `src/lib/router/index.ts` — the existing comment on the `catch` block is good ("Analyst unavailable or timed out — regex fallback keeps routing working"); verify no noise comments; keep the Strategy pattern implicit in the code structure (no need to comment "this is the Strategy pattern")
- [X] T046 [P] [US4] Comment hygiene in `src/pages/api/route.ts` — KEEP the "Auto-continue when the model hit the token limit mid-response" comment (explains business logic); KEEP the "5 min" timeout comment with added reasoning (why 5 minutes: specialist models processing large inputs may be slow on consumer hardware); REMOVE all `// ── Step N ──` decorative dividers (function extraction in US3 replaces their purpose)
- [X] T047 [P] [US4] Comment hygiene in `src/pages/api/translate.ts` — KEEP the "Code blocks are extracted client-side before this endpoint is called" comment (explains non-obvious client/server coordination); review systemPrompt function for any noise comments
- [X] T048 [P] [US4] Comment hygiene + duplication audit in `src/pages/` Astro files — review `index.astro`, `settings.astro`, `tasks/commit.astro`, `tasks/explain.astro`, `tasks/refactor.astro`, `tasks/test.astro`, `src/layouts/AppLayout.astro`, `src/components/Navbar.astro`. Verify that task pages share no duplicated prose or attribute patterns beyond what `AppLayout` + `TaskApp` already consolidate; document the finding (no extraction needed — pages are already at minimum abstraction).
- [X] T049 [US4] Comment hygiene in `src/lib/config/model-config.ts` (new file from US2) — add "why" for `STORAGE_KEY` naming convention and why `loadModelConfig` merges over DEFAULTS (forward-compatible: new config keys added in the future always have a valid fallback without breaking existing stored configs)

**Checkpoint**: US4 complete. Zero noise comments. Key technical decisions documented. `pnpm test && pnpm lint && pnpm build` all green.

---

## Phase 7: Polish & Final Audit

**Purpose**: Full verification pass across all slices; confirm every success criterion from spec.md is met.

- [X] T059 [P] Audit prop count compliance (FR-010): run `grep -rn "readonly [a-zA-Z]" src/components --include="*.tsx"` to identify component interfaces with >6 props; for each flagged component (e.g., `ModelSectionCard`, `ModelDetailsPanel`) verify it has been reviewed for context/compound pattern candidacy and document the decision (decompose or justify retention)
- [X] T050 Run complete test suite: `pnpm test` — all tests (existing + new) must pass; record final test count
- [X] T051 [P] Verify zero manual memoisation: `grep -rn "useCallback\|useMemo" src/ --include="*.ts" --include="*.tsx"` must return 0 results
- [X] T052 [P] Verify complexity compliance: `pnpm lint` — zero warnings; all functions in modified files have cyclomatic complexity ≤ 5
- [X] T053 Verify no noise comments remain: manually spot-check 5 random modified files; confirm all comments answer "why" not "what"
- [X] T054 [P] Verify coverage parity: `pnpm test -- --coverage` — overall coverage percentage must be ≥ pre-refactor baseline recorded in T001
- [X] T055 [P] Verify import correctness: `grep -rn "from.*ModelConfigDialog" src/` must show zero utility function imports (only the component import in files that render the nav button)
- [X] T056 Verify component size: confirm no component in `src/components/chat/` or `src/components/model/` renders more than 50 lines of JSX (count lines between `return (` and the matching `)`)
- [X] T057 Run `pnpm build` — full production build must succeed with zero errors
- [X] T058 Update `specs/002-code-quality-refactor/checklists/requirements.md` — mark all items as complete with verification evidence

**Checkpoint**: All success criteria met. Refactor complete.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational — React Compiler)
        ├── Phase 3 (US1 — Component Decomposition) ──┐
        ├── Phase 4 (US2 — Custom Hooks & Utils)      │ can run in parallel
        ├── Phase 5 (US3 — Performance)               │ after Phase 2
        └── Phase 6 (US4 — Comment Hygiene) ──────────┘
              └── Phase 7 (Polish & Final Audit)
```

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No dependency on US2/US3/US4.
- **US2 (P2)**: Starts after Phase 2. Some tasks depend on US1 completing first (T023–T025 update ChatContainer imports which US1 modifies).
- **US3 (P3)**: Starts after Phase 2. T036 (context shape audit) requires US1 complete (ChatContainer refactored). T037 (final compiler verification) runs last in this story.
- **US4 (P4)**: Can begin in parallel with US1–US3 for files those stories don't touch. For files modified by US1–US3, run after that story's checkpoint.

### Dependency exceptions within stories

- T013 (`useChatSession`) must complete before T016 (simplify ChatContainer)
- T014 + T015 (`useChatInput` + `useFileAttachment`) must complete before T017 (simplify ChatInput)
- T021 (`model-config.ts`) must complete before T022–T025 (update imports)
- T026 (`resolve-model.ts`) must complete before T027–T028 (update route handlers)
- T031–T033 must complete before T034 (step functions before orchestrator update)

---

## Parallel Opportunities

### Phase 2 (after T003)
```
T004 (astro.config.ts) ──┐
T005 (vitest.config.ts) ─┤ all parallel
T006 (oxlint.config.ts) ─┘
T007 (remove useMemo in use-model-config-page.ts)
T008 (remove useCallback in ChatContainer.tsx)
```

### Phase 3 (US1) — Tests first, then implementation
```
T010 (use-chat-session.test.ts) ──┐
T011 (use-chat-input.test.ts) ────┤ write tests in parallel
T012 (use-file-attachment.test.ts)┘

T013 (use-chat-session.ts) ────────────────────────────── sequential (must finish for T016)
T014 (use-chat-input.ts) ──────┐ parallel with each other
T015 (use-file-attachment.ts) ─┘ (must both finish for T017)

T031 → T032 → T033 → T034 → T035 — sequential (all modify route.ts)
```

### Phase 4 (US2) — Tests first
```
T019 (model-config.test.ts) ──┐ parallel
T020 (resolve-model.test.ts) ─┘

T021 (model-config.ts) ──────────────────── then T022, T023, T024, T025 can partially parallel
T026 (resolve-model.ts) ──── then T027 ──┐ parallel
                              then T028 ──┘
T029 (analyst.ts) ─────────────────────────── independent of above
```

### Phase 5 (US3)
```
T036 (context shape audit) ── then T037 (final compiler verification) — sequential
```

### Phase 6 (US4) — Most tasks fully parallel
```
T038 (chat components) ───────┐
T039 (model components) ──────┤
T040 (layout components) ─────┤ all fully parallel
T041 (lib/utils/) ────────────┤
T042 (lib/prompts/) ──────────┤
T043 (lib/api/sse.ts) ────────┤
T044 (lib/router/analyst.ts) ─┤
T045 (lib/router/index.ts) ───┘
```

---

## Implementation Strategy

### MVP First (US1 — Component Decomposition Only)

1. Complete Phase 1: Baseline validation
2. Complete Phase 2: React Compiler + quality gates
3. Complete Phase 3: US1 (useChatSession + useChatInput + useFileAttachment + simplified components)
4. **STOP and VALIDATE**: `pnpm test && pnpm lint && pnpm build` all green; components are pure renderers
5. Ship/demo if needed

### Incremental Delivery

1. Phase 1 + 2 → Compiler active, gates enforced
2. Phase 3 (US1) → Components decomposed, hooks with tests ✓
3. Phase 4 (US2) → Utilities extracted, duplication eliminated ✓
4. Phase 5 (US3) → API decomposed, performance verified ✓
5. Phase 6 (US4) → Comment hygiene complete ✓
6. Phase 7 → Final audit, all criteria green ✓

---

## Notes

- **[P] tasks** = different files, no dependencies on in-progress tasks from the same phase
- **Story labels** map to user stories in `spec.md`
- Each story is independently testable: `pnpm test src/__tests__/hooks/` after US1 passes independently
- Commit after each phase checkpoint; use `git bisect` to diagnose any regressions
- The React Compiler produces actionable error messages — if it rejects a pattern, address the pattern rather than disabling the compiler for that file
- `src/components/ui/` is explicitly out of scope — do not modify any shadcn/ui primitive
- Total new test files: 5 (`use-chat-session`, `use-chat-input`, `use-file-attachment`, `model-config`, `resolve-model`)
