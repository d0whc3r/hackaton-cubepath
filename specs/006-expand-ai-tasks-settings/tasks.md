# Tasks: Expand AI Tasks & Settings Redesign

**Input**: Design documents from `/specs/006-expand-ai-tasks-settings/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-route.md

**Organization**: Tasks grouped by user story. Each story is independently testable after Phase 2 completes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks in same phase)
- **[Story]**: Which user story ([US1]–[US8]) this task belongs to
- Note: AppSidebar.tsx is touched by multiple stories — do not run those tasks in parallel

---

## Phase 1: Setup (Type & Schema Scaffolding)

**Purpose**: Extend TypeScript types and schemas so the project compiles cleanly before any runtime code changes. All downstream tasks depend on these type changes being in place.

**⚠️ CRITICAL**: All user story work is blocked until this phase is complete.

- [X] T001 Extend `TaskTypeSchema` in `src/lib/schemas/route.ts` to include 6 new values: `docstring`, `type-hints`, `error-explain`, `performance-hint`, `naming-helper`, `dead-code`
- [X] T002 Extend `RouteRequestSchema` in `src/lib/schemas/route.ts` with 6 new optional model override fields: `docstringModel`, `typeHintsModel`, `errorExplainModel`, `performanceHintModel`, `namingHelperModel`, `deadCodeModel` (all `z.string().optional()`)
- [X] T003 Add 6 new fields to `ModelConfig` interface and `DEFAULTS` object in `src/lib/config/model-config.ts`: `docstringModel` (default `phi3.5`), `typeHintsModel` (default `qwen2.5-coder:7b`), `errorExplainModel` (default `phi3.5`), `performanceHintModel` (default `qwen2.5-coder:7b`), `namingHelperModel` (default `phi3.5`), `deadCodeModel` (default `qwen2.5-coder:7b`); also extend `TASK_MODEL_KEY` with the 6 new `TaskType → configKey` mappings
- [X] T004 Update `SectionId` and `SectionGroupId` types in `src/components/model/settings/types.ts`: add 6 new `SectionId` values (`docstring`, `type-hints`, `error-explain`, `performance-hint`, `naming-helper`, `dead-code`); replace `SectionGroupId` values `management | code` with `infrastructure | analysis | generation` (keep `language`)

**Checkpoint**: `npm run lint` passes with zero type errors — no runtime changes yet.

---

## Phase 2: Foundational (Models, Prompts, Direct Router, API)

**Purpose**: Pure data and function modules — model lists, prompt builders, the direct router, and the API route update. These are the building blocks all task user stories depend on.

**⚠️ CRITICAL**: Task pages (US1–US6) cannot function without the API route update (T019).

- [X] T005 [P] Create `src/lib/router/models/error-explain.ts` exporting `ERROR_EXPLAIN_MODELS: ModelOption[]` (5 options: phi3.5 as default, llama3.2:3b, gemma3:4b, qwen2.5:3b, llama3.2:1b) and `DEFAULT_ERROR_EXPLAIN_MODEL = 'phi3.5'`
- [X] T006 [P] Create `src/lib/router/models/docstring.ts` exporting `DOCSTRING_MODELS: ModelOption[]` (4 options: phi3.5 as default, qwen2.5-coder:7b, qwen2.5-coder:3b, gemma3:4b) and `DEFAULT_DOCSTRING_MODEL = 'phi3.5'`
- [X] T007 [P] Create `src/lib/router/models/type-hints.ts` exporting `TYPE_HINTS_MODELS: ModelOption[]` (4 options: qwen2.5-coder:7b as default, qwen2.5-coder:3b, qwen2.5-coder:1.5b, deepseek-coder-v2:16b) and `DEFAULT_TYPE_HINTS_MODEL = 'qwen2.5-coder:7b'`
- [X] T008 [P] Create `src/lib/router/models/performance-hint.ts` exporting `PERFORMANCE_HINT_MODELS: ModelOption[]` (4 options: qwen2.5-coder:7b as default, deepseek-coder-v2:16b, gemma3:12b, qwen2.5-coder:3b) and `DEFAULT_PERFORMANCE_HINT_MODEL = 'qwen2.5-coder:7b'`
- [X] T009 [P] Create `src/lib/router/models/naming-helper.ts` exporting `NAMING_HELPER_MODELS: ModelOption[]` (4 options: phi3.5 as default, gemma3:4b, llama3.2:3b, qwen2.5:3b) and `DEFAULT_NAMING_HELPER_MODEL = 'phi3.5'`
- [X] T010 [P] Create `src/lib/router/models/dead-code.ts` exporting `DEAD_CODE_MODELS: ModelOption[]` (4 options: qwen2.5-coder:7b as default, qwen2.5-coder:3b, phi3.5, deepseek-coder-v2:16b) and `DEFAULT_DEAD_CODE_MODEL = 'qwen2.5-coder:7b'`
- [X] T011 Update `src/lib/router/models/index.ts`: export all 6 new model lists and default constants; add all 6 new task types to `MODELS_BY_TASK` and `DEFAULT_MODELS` records (depends on T005–T010)
- [X] T012 [P] Create `src/lib/prompts/error-explain.ts` exporting `buildErrorExplainPrompt(): string` — instructs the model to parse `ERROR:` and `CODE:` sections from input, explain the root cause in plain language, and return numbered fix steps
- [X] T013 [P] Create `src/lib/prompts/docstring.ts` exporting `buildDocstringPrompt(context: CodeContext): string` — instructs the model to add or update documentation comments covering parameters, return values, and purpose; must preserve all logic, structure, and variable names unchanged
- [X] T014 [P] Create `src/lib/prompts/type-hints.ts` exporting `buildTypeHintsPrompt(context: CodeContext): string` — instructs the model to add type annotations only; explicitly states "do not change logic, rename identifiers, or restructure code"
- [X] T015 [P] Create `src/lib/prompts/performance-hint.ts` exporting `buildPerformanceHintPrompt(context: CodeContext): string` — instructs the model to return an advisory bullet list of optimization suggestions; explicitly states "do not rewrite code, preserve all behavior"
- [X] T016 [P] Create `src/lib/prompts/naming-helper.ts` exporting `buildNamingHelperPrompt(context: CodeContext): string` — instructs the model to return a `before → after` rename list with one-line rationale per entry; explicitly states "do not rewrite code, return list only"
- [X] T017 [P] Create `src/lib/prompts/dead-code.ts` exporting `buildDeadCodePrompt(context: CodeContext): string` — instructs the model to list unused imports, unreachable code blocks, and redundant variables by name and approximate location; explicitly states "do not modify code, report findings only"
- [X] T018 Create `src/lib/router/direct.ts` exporting `routeDirect(taskType, input, modelId): { modelId: string; systemPrompt: string; displayName: string }` — builds the appropriate system prompt from the task type (using T012–T017 prompt builders) and returns the model to call, bypassing analyst routing (depends on T012–T017); pass a minimal `CodeContext` stub `{ language: 'unknown', isDiff: false, framework: null }` to all prompt builders that accept `CodeContext`; the `buildErrorExplainPrompt` (T012) takes no `CodeContext` parameter and should be called without one
- [X] T019 Update `src/pages/api/route.ts`: (a) add 6 new model fields to `ValidatedRequest` interface; (b) resolve new model overrides using 3-tier priority pattern (request → env var → default) in the `POST` handler; (c) add `buildDirectStream()` function that calls `routeDirect()` and emits: a `routing_step` generating_response active event, then response chunks, then a `routing_step` generating_response done event, then `cost` and `done`; (d) also emit a `specialist_selected` event from `buildDirectStream()` — `{ displayName: '<TaskLabel> Specialist', modelId: resolvedModelId, language: 'code', specialistId: '<taskType>-specialist' }` — so the frontend displays the active model for new tasks consistently with existing tasks; (e) branch in `buildSSEStream()` — if `taskType` is one of the 6 new types, call `buildDirectStream()` instead of the analyst routing path (depends on T011, T018)

**Checkpoint**: `npm test && npm run lint` passes. New task types are accepted by the API and return a streamed response using default models.

---

## Phase 3: US7 + US8 — Per-Task Model Selection & Settings Redesign (Priority: P1 + P2)

**Goal**: Users can configure a dedicated model for each new task in a redesigned 4-tab settings page (Infrastructure / Analysis / Generation / Language).

**Independent Test**: Open `/settings` — verify 4 tabs are visible; navigate to Analysis tab; verify error-explain, performance-hint, dead-code, naming-helper, explain sections appear; select a non-default model for any new task; save; reload page; confirm selection persists.

- [X] T020 [US7] [US8] Update `src/components/model/settings/constants.ts`: (a) update each existing section's `group` field **individually** — do NOT do a flat string rename of group IDs; change analyst's `group` from `'management'` to `'infrastructure'`; change commit's `group` from `'management'` to `'generation'`; change explain's `group` from `'code'` to `'analysis'`; change test's `group` and refactor's `group` from `'code'` to `'generation'`; (b) add 6 new `SectionDef` entries: error-explain (group `analysis`), performance-hint (group `analysis`), dead-code (group `analysis`), naming-helper (group `analysis`), docstring (group `generation`), type-hints (group `generation`) — each with appropriate `configKey`, `models`, `title`, `subtitle`, `selectionHint`, and `accent`
- [X] T021 [US7] [US8] Update `GROUPS` constant in `src/components/model/ModelConfigPage.tsx` (lines 20–24): replace `{ id: 'management', label: 'Management' }, { id: 'code', label: 'Code' }` with `{ id: 'infrastructure', label: 'Infrastructure' }, { id: 'analysis', label: 'Analysis' }, { id: 'generation', label: 'Generation' }` (keep `{ id: 'language', label: 'Language' }` unchanged); also update `activeGroup` initial state default from `activeSectionDef.group` (no code change needed — follows automatically from group rename)
- [X] T022 [US8] Restructure task navigation in `src/components/layout/AppSidebar.tsx`: (a) replace the single `TASK_ITEMS` constant and its `<SidebarGroup label="Tasks">` with two constants — `ANALYSIS_TASK_ITEMS` (initially `[{ href: '/tasks/explain', icon: BookOpen, label: 'Explain Code' }]`) and `GENERATION_TASK_ITEMS` (initially `[{ href: '/tasks/test', ... }, { href: '/tasks/refactor', ... }, { href: '/tasks/commit', ... }]`); (b) render them as two separate `<SidebarGroup>` blocks labelled "Analysis" and "Generation"; (c) keep `TASK_PATH_BY_TYPE` unchanged — all 4 existing task paths remain; (d) verify existing navigation and active-state highlighting works for all 4 existing tasks after the restructure

**Checkpoint**: Settings page shows 4 tabs; Analysis and Generation groups exist in sidebar (empty at this point); existing tasks still appear and model selections still persist.

---

## Phase 4: US1 — Error Explanation Task (Priority: P1) 🎯 MVP

**Goal**: Users can submit an error message (+ optional code snippet) to the Error Explain task and receive a streamed root-cause explanation with numbered fix steps.

**Independent Test**: Visit `/tasks/error-explain`; type an error message in the first field; click submit; verify response streams with an explanation and at least one fix step. Verify submitting with empty first field shows an inline validation message and no request is sent.

- [X] T023 [US1] Create `src/components/chat/ErrorExplainApp.tsx`: renders two labeled text areas ("Error message" required; "Code snippet" optional) inside the standard `TaskApp` layout; manages `touched` state per field; on submit — if error message is empty, sets `touched = true` and renders an inline validation message below the field without sending a request; if valid, combines inputs as `ERROR:\n{errorMsg}\n\nCODE:\n{codeSnippet}` and calls the existing API route with `taskType: 'error-explain'` and the combined string as `input`
- [X] T024 [US1] Create `src/pages/tasks/error-explain.astro` wrapping `<ErrorExplainApp client:load />` inside `<AppLayout>` with title "SLM Router — Error Explain" and description "Paste an error message and optional code snippet to get a root-cause explanation and fix steps."
- [X] T025 [US1] Add error-explain entry to the Analysis `<SidebarGroup>` in `src/components/layout/AppSidebar.tsx`: add `{ href: '/tasks/error-explain', icon: AlertCircle, label: 'Error Explain' }` to the analysis items array; add `'error-explain': '/tasks/error-explain'` to `TASK_PATH_BY_TYPE`; import `AlertCircle` from lucide-react

**Checkpoint**: `/tasks/error-explain` loads; dual-input works; inline validation fires on empty submit; valid submit streams a response; error-explain appears in sidebar under Analysis.

---

## Phase 5: US2 — Docstring / Comments Generation (Priority: P2)

**Goal**: Users can submit a code snippet (+ optional module description) to the Docstring task and receive the code enriched with documentation comments, without any logic changes.

**Independent Test**: Visit `/tasks/docstring`; submit a function without docstrings; verify response contains the original code with documentation comments added and no logic modifications.

- [X] T026 [US2] Create `src/components/chat/DocstringApp.tsx`: renders a primary "Code snippet" text area (required) and an optional "Module description" text area below it (labelled "What does this module/function do? (optional)"); on submit — if code is empty, show inline validation message and do not send; if valid, combine as `CODE:\n{code}\n\nDESCRIPTION:\n{description}` when description is non-empty, or send the code alone when no description is provided; call the API with `taskType: 'docstring'`; wraps the standard `TaskApp` shell layout. Then create `src/pages/tasks/docstring.astro` wrapping `<DocstringApp client:load />` inside `<AppLayout>` with title "SLM Router — Docstring" and description "Generate or update documentation comments. Paste your code and an optional description of what the module does."
- [X] T027 [US2] Add docstring entry to the Generation `<SidebarGroup>` in `src/components/layout/AppSidebar.tsx`: add `{ href: '/tasks/docstring', icon: FileText, label: 'Docstring' }` to the generation items array; add `'docstring': '/tasks/docstring'` to `TASK_PATH_BY_TYPE`; import `FileText` from lucide-react

**Checkpoint**: `/tasks/docstring` loads; submitting code returns a streamed response with documentation comments; task appears in sidebar under Generation.

---

## Phase 6: US3 — Type Hints / Typing Suggestions (Priority: P2)

**Goal**: Users can submit untyped or partially typed code and receive the same code with type annotations added — no logic changes.

**Independent Test**: Visit `/tasks/type-hints`; submit an untyped function; verify response shows the function with type annotations on all parameters and return value and no other changes.

- [X] T028 [US3] Create `src/pages/tasks/type-hints.astro` wrapping `<TaskApp client:load fixedTaskType="type-hints" pageTitle="Type Hints" pageDescription="Add type annotations to your functions and parameters without changing any logic." />` inside `<AppLayout>`
- [X] T029 [US3] Add type-hints entry to the Generation `<SidebarGroup>` in `src/components/layout/AppSidebar.tsx`: add `{ href: '/tasks/type-hints', icon: Type, label: 'Type Hints' }` to the generation items array; add `'type-hints': '/tasks/type-hints'` to `TASK_PATH_BY_TYPE`; import `Type` from lucide-react

**Checkpoint**: `/tasks/type-hints` loads; submitting an untyped function returns a streamed response with type annotations; task appears in sidebar under Generation.

---

## Phase 7: US4 — Performance Hint Review (Priority: P3)

**Goal**: Users can submit a code snippet and receive an advisory list of non-breaking performance optimization suggestions.

**Independent Test**: Visit `/tasks/performance-hint`; submit a function with a nested loop; verify response is a bullet list of suggestions without rewriting the code.

- [X] T030 [US4] Create `src/pages/tasks/performance-hint.astro` wrapping `<TaskApp client:load fixedTaskType="performance-hint" pageTitle="Performance Hint" pageDescription="Get advisory optimization suggestions for your code without changing any behavior." />` inside `<AppLayout>`
- [X] T031 [US4] Add performance-hint entry to the Analysis `<SidebarGroup>` in `src/components/layout/AppSidebar.tsx`: add `{ href: '/tasks/performance-hint', icon: Zap, label: 'Performance Hint' }` to the analysis items array; add `'performance-hint': '/tasks/performance-hint'` to `TASK_PATH_BY_TYPE`; import `Zap` from lucide-react

**Checkpoint**: `/tasks/performance-hint` loads; submitting code returns advisory suggestions; task appears in sidebar under Analysis.

---

## Phase 8: US5 — Naming Helper (Priority: P3)

**Goal**: Users can submit code and receive a structured `before → after` rename list with rationale — no code rewrite.

**Independent Test**: Visit `/tasks/naming-helper`; submit a function with cryptic variable names; verify response is a list of `before → after` pairs with explanations, not a rewritten function.

- [X] T032 [US5] Create `src/pages/tasks/naming-helper.astro` wrapping `<TaskApp client:load fixedTaskType="naming-helper" pageTitle="Naming Helper" pageDescription="Get rename suggestions for unclear variables and functions as a before → after list." />` inside `<AppLayout>`
- [X] T033 [US5] Add naming-helper entry to the Analysis `<SidebarGroup>` in `src/components/layout/AppSidebar.tsx`: add `{ href: '/tasks/naming-helper', icon: Tag, label: 'Naming Helper' }` to the analysis items array; add `'naming-helper': '/tasks/naming-helper'` to `TASK_PATH_BY_TYPE`; import `Tag` from lucide-react

**Checkpoint**: `/tasks/naming-helper` loads; submitting code with unclear names returns a rename list; task appears in sidebar under Analysis.

---

## Phase 9: US6 — Dead Code / Cleanup Suggestions (Priority: P3)

**Goal**: Users can submit a file or fragment and receive a structured list of cleanup issues (unused imports, dead code, redundant variables) — no code modifications.

**Independent Test**: Visit `/tasks/dead-code`; submit a file with known unused imports; verify response lists each unused import by name with approximate location without modifying the code.

- [X] T034 [US6] Create `src/pages/tasks/dead-code.astro` wrapping `<TaskApp client:load fixedTaskType="dead-code" pageTitle="Dead Code" pageDescription="Identify unused imports, unreachable code, and redundant variables in your file or fragment." />` inside `<AppLayout>`
- [X] T035 [US6] Add dead-code entry to the Analysis `<SidebarGroup>` in `src/components/layout/AppSidebar.tsx`: add `{ href: '/tasks/dead-code', icon: Trash2, label: 'Dead Code' }` to the analysis items array; add `'dead-code': '/tasks/dead-code'` to `TASK_PATH_BY_TYPE`; import `Trash2` from lucide-react

**Checkpoint**: `/tasks/dead-code` loads; submitting code with dead imports returns a cleanup list; task appears in sidebar under Analysis.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Home page grouped layout, input validation for standard task pages, and final validation run.

- [X] T036 Refactor `src/components/layout/OverviewTaskCards.tsx`: replace the flat `TASKS` array and single `<div className="grid">` with two labeled sections — **Analysis** (explain, error-explain, performance-hint, dead-code, naming-helper) and **Generation** (test, refactor, docstring, type-hints, commit); each section has a `<h2>` group label and its own task card grid; update `TASKS` definitions to include the 6 new tasks with appropriate icons, colors, descriptions, and `task` values matching new `TaskType` values; ensure `getModelForTask` and `MODELS_BY_TASK` lookups work for new task types
- [X] T037 In `src/components/chat/ChatContainer.tsx` (or wherever the submit handler and API request payload are built): (a) add inline validation — when the user submits with an empty input field, set `touched = true` and render an inline error message ("Code is required") below the input without sending the request; this applies to all standard task pages (docstring handled by DocstringApp T026; error-explain by ErrorExplainApp T023); (b) also update the API request payload to include the 6 new per-task model override fields (e.g., `docstringModel: config.docstringModel`, `typeHintsModel: config.typeHintsModel`, etc.) — read from `loadModelConfig()` the same way existing model fields are sent — so FR-016 is satisfied end-to-end and user-configured models are actually used
- [X] T038 [P] Verify `quickstart.md` validation steps: pull a default model (`ollama pull phi3.5`), visit each new task page, submit valid input, confirm streamed response; visit settings, confirm all 4 tabs and 12 sections render without layout breakage on a 1280px window; confirm model selection persists after reload
- [X] T039 [P] Run `npm test && npm run lint` and fix any remaining type errors or test failures introduced by the feature

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)       → no dependencies — start immediately
Phase 2 (Foundational)→ depends on Phase 1 (type changes must compile)
Phase 3 (US7+US8)     → depends on Phase 2 (SectionDef needs new configKeys from ModelConfig)
Phase 4 (US1)         → depends on Phase 2 (API must handle error-explain)
Phase 5 (US2)         → depends on Phase 2 (API must handle docstring)
Phase 6 (US3)         → depends on Phase 2 (API must handle type-hints)
Phase 7 (US4)         → depends on Phase 2 (API must handle performance-hint)
Phase 8 (US5)         → depends on Phase 2 (API must handle naming-helper)
Phase 9 (US6)         → depends on Phase 2 (API must handle dead-code)
Phase 10 (Polish)     → depends on Phases 4–9 all complete
```

Phases 3–9 can all start independently once Phase 2 is complete.

### AppSidebar.tsx — Sequential constraint

T022, T025, T027, T029, T031, T033, T035 all touch `AppSidebar.tsx`. They must be applied sequentially (not in parallel). Since they are in different phases, the phase order ensures this.

Note: T022 pre-populates `ANALYSIS_TASK_ITEMS` with `explain` and `GENERATION_TASK_ITEMS` with `test`, `refactor`, `commit` — so the sidebar is never empty after T022 completes. Each subsequent task (T025, T027, etc.) appends to the correct array.

### Within Phase 2

T005–T010 (model files) are fully parallel.
T012–T017 (prompt files) are fully parallel.
T005–T010 must complete before T011.
T012–T017 must complete before T018.
T011 and T018 must complete before T019.

---

## Parallel Opportunities

### Phase 2 — Model files and prompt files

```
Parallel group A (model lists):
  T005 error-explain models
  T006 docstring models
  T007 type-hints models
  T008 performance-hint models
  T009 naming-helper models
  T010 dead-code models
→ Then: T011 (index.ts update)

Parallel group B (prompts):
  T012 error-explain prompt
  T013 docstring prompt
  T014 type-hints prompt
  T015 performance-hint prompt
  T016 naming-helper prompt
  T017 dead-code prompt
→ Then: T018 (direct.ts) → T019 (api/route.ts)
```

### Phases 3–9 — After Phase 2 completes

All of Phases 3, 4, 5, 6, 7, 8, 9 can start independently (different files except AppSidebar). With multiple developers:
```
Developer A: Phase 3 (settings UI)
Developer B: Phase 4 (error-explain task + component)
Developer C: Phase 5+6 (docstring + type-hints pages)
Developer D: Phase 7+8+9 (performance-hint, naming-helper, dead-code pages)
```

---

## Implementation Strategy

### MVP (Phase 1 + Phase 2 + Phase 4 only)

1. Complete Phase 1: Schema & Types
2. Complete Phase 2: Foundational
3. Complete Phase 4: US1 Error Explain
4. **STOP and VALIDATE**: error-explain task is fully functional end-to-end
5. This delivers the highest-P1 task with a working model pipeline

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready; all task types accepted by API
2. Phase 3 → Settings UI shows new tasks; users can configure models
3. Phase 4 → Error Explain live (P1 complete)
4. Phase 5 + 6 → Docstring + Type Hints live (P2 code generation tasks)
5. Phase 7 + 8 + 9 → Remaining P3 tasks live
6. Phase 10 → Home page grouped; input validation; final tests

Each increment adds new tasks without breaking existing ones.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- AppSidebar.tsx updates (T022, T025, T027, T029, T031, T033, T035) must be applied one at a time
- All new Astro pages follow the same simple pattern as `src/pages/tasks/explain.astro` (3 lines)
- Error Explain is the only task requiring a custom component — all others use the existing `TaskApp`
- The `routeDirect()` function (T018) does not call any LLM — it only builds the prompt; the LLM call happens in the API route's new `buildDirectStream()` function (T019)
- Commit after each phase checkpoint to keep history clean and reversible
