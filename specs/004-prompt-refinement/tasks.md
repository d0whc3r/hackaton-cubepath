# Tasks: Prompt Refinement with Skills

**Input**: Design documents from `/specs/004-prompt-refinement/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/prompt-api.md ✓, quickstart.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths are included in every description

---

## Phase 1: Setup (Baseline Validation)

**Purpose**: Confirm current failing test state before making any changes, so regressions can be detected immediately.

- [X] T001 Run `pnpm test --reporter=verbose 2>&1 | grep -E "✓|✗|FAIL|PASS|×" | head -60` to record which tests in `src/__tests__/lib/router/specialists.test.ts` and `src/__tests__/lib/router/router.test.ts` currently fail

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Routing infrastructure fixes that unblock both `router.test.ts` tests and enable the specialist wrapper improvements. MUST complete before Phase 3.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Add `detectedLanguage: DetectedLanguage` field to the `RoutingDecision` interface in `src/lib/router/types.ts` — value is `{ language: codeContext.language, confidence: codeContext.confidence }`, populated by `route()` and `routeWithAnalyst()`

- [X] T003 Refactor `src/lib/router/index.ts`: rename the existing async `route()` to `routeWithAnalyst(taskType, input, specialists, analystModelId, baseUrl): Promise<RoutingDecision>` and add a new synchronous `route(taskType, input, specialists): RoutingDecision` that uses `fallbackAnalysis(input)` directly and includes `detectedLanguage` in the returned object

- [X] T004 Add `inferTestFramework(language: string): string | null` helper to `src/lib/router/specialists.ts` (same mapping as `defaultFramework` in analyst.ts: TypeScript/JavaScript→Vitest, Python→pytest, Go→Go testing package, Java/Kotlin→JUnit, Ruby→RSpec, Rust→Rust built-in test attribute); update `test` specialist wrapper to enrich context with `testFramework: context.testFramework ?? inferTestFramework(context.language)`; update `commit` specialist wrapper to enrich context with `isDiff: context.isDiff || /^diff --git|^@@\s/.test(input.trimStart())`; additionally, make `testModel`, `refactorModel`, and `commitModel` optional in the `SpecialistEnv` interface (`testModel?: string`, `refactorModel?: string`, `commitModel?: string`) so TypeScript strict mode does not reject the partial object used in `router.test.ts`

- [X] T005 Update `src/pages/api/route.ts` to import `routeWithAnalyst` from `@/lib/router/index` and replace `await route(req.taskType, req.input, specialists, req.analystModel, baseUrl)` with `await routeWithAnalyst(req.taskType, req.input, specialists, req.analystModel, baseUrl)`

**Checkpoint**: After T002–T005, all 8 `router.test.ts` tests should pass. Verify with `pnpm test src/__tests__/lib/router/router.test.ts` before proceeding.

---

## Phase 3: User Story 1 — Apply Prompt Engineering Best Practices (Priority: P1) 🎯 MVP

**Goal**: Apply systematic prompt engineering (RSCIT framework from `llm-prompt-optimizer` skill) to all five specialist prompts — adding clear output contracts, plain-text format instructions, and eliminating structural ambiguity.

**Independent Test**: Run `pnpm test src/__tests__/lib/router/specialists.test.ts` — all format-related assertions pass: `plain text`, `no markdown`, `Why it works`, `Section 1`/`Section 2`, `Behavior preserved:`, `legib`.

### Implementation for User Story 1

- [X] T006 [P] [US1] Update `src/lib/prompts/explain.ts`: replace `"Use Markdown formatting in your response."` with `"Use plain text. Do not use markdown formatting."` and remove the `##` prefix from ALL section label lines — change `## What it does` → `What it does`, `## How it works` → `Why it works`, `## Example usage` → `Example`, `## Risks & pitfalls` → `Risks & pitfalls`; section names appear as plain labeled lines, not markdown headers; add instructions against verbose preambles and missing sections; add explicit output contract listing all four section names in order

- [X] T007 [P] [US1] Update `src/lib/prompts/refactor.ts`: replace `"Use Markdown formatting in your response."` with `"Use plain text."`, and add a legibility-first instruction before the section list — e.g. `"Focus on legibility and readability. For each change, explain why it improves clarity — not just what changed."` — keeping the existing three-section structure (`Refactored code`, `Changes made`, `Behavior note`) and the `Behavior preserved:` line

- [X] T008 [P] [US1] Update `src/lib/prompts/test.ts`: replace `"Use Markdown formatting in your response."` with `"Use plain text."` in both the known-language branch and unknown-language branch; rename `"## Executable tests"` to `"Section 1: Executable tests"` and `"## Edge cases"` to `"Section 2: Edge cases"` in the known-language branch; preserve pseudocode path for unknown language unchanged

- [X] T009 [P] [US1] Update `src/lib/prompts/analyst.ts`: enhance `buildAnalystSystemPrompt()` with explicit task type definitions (explain = understand what code does, refactor = improve code quality/structure, test = generate tests, commit = write git commit message) and explicit disambiguation rules (e.g. if task is "test", prioritize identifying the test framework); enhance `buildAnalystUserPrompt()` field rules with task-specific guidance and an example for the commit task showing diff vs prose disambiguation; keep the JSON schema and output contract identical

**Checkpoint**: After T006–T009, verify `pnpm test src/__tests__/lib/router/specialists.test.ts` — expected passing: explain plain text ✓, explain Why it works ✓, test Section 1/2 ✓, test plain text ✓, refactor plain text ✓, refactor legib ✓.

---

## Phase 4: User Story 2 — Enrich Prompts with Domain-Specific Skill Knowledge (Priority: P2)

**Goal**: Deepen each specialist's prompt with domain expertise from the project's skill library — so the model's responses align with real best practices, not just structural compliance.

**Independent Test**: Verify manually on a known input: the `refactor` specialist identifies single-responsibility violations; the `test` specialist follows AAA pattern; the `explain` specialist covers design tradeoffs.

### Implementation for User Story 2

- [X] T010 [P] [US2] **Additive edit** (extends T006 — do not replace, only append to existing section instructions): Enhance `src/lib/prompts/explain.ts` with `code-reviewer` skill depth: update the `Risks & pitfalls` section instruction to require the model to cover not just bugs but also design tradeoffs and API footguns; add a note in the `Why it works` instruction to identify the key design decisions and trade-offs the author made; add instruction to flag any naming, error handling, or contract inconsistencies a senior reviewer would catch

- [X] T011 [P] [US2] **Additive edit** (extends T007 — do not replace, only append to existing section instructions): Enhance `src/lib/prompts/refactor.ts` with `clean-code` + `architecture-patterns` skill depth: add guidance in the `Changes made` instruction to specifically apply single-responsibility and clear-naming principles; instruct the model that if a function has too many responsibilities or a long parameter list, it should suggest splitting or introducing a parameter object; reinforce the legibility-first principle with "prefer readable code over clever code"

- [X] T012 [P] [US2] **Additive edit** (extends T008 — do not replace, only append to existing section instructions): Enhance `src/lib/prompts/test.ts` with `javascript-testing-patterns` skill depth: in the `Section 1: Executable tests` instruction, specify that tests MUST follow the Arrange-Act-Assert (AAA) pattern with clear separation of each phase; instruct the model to cover both the happy path and the primary error path in the executable tests section; add instruction that tests must be self-contained (no external state dependencies between test cases)

**Checkpoint**: After T010–T012, re-run `pnpm test src/__tests__/lib/router/specialists.test.ts` to confirm no regressions were introduced by the enrichments.

---

## Phase 5: User Story 3 — Validate Prompt Quality Against Existing Tests (Priority: P2)

**Goal**: Confirm zero regressions in previously-passing tests AND verify at least 50% of the target failing tests now pass (SC-002: 9 specialists + 8 router = 17 target failures).

**Independent Test**: `pnpm test` — full suite passes with zero previously-passing tests newly failing.

### Implementation for User Story 3

- [X] T013 [US3] Run the full test suite: `pnpm test 2>&1` and record results — confirm all `specialists.test.ts` tests pass; confirm all `router.test.ts` tests pass; confirm no other test files have regressed

- [X] T014 [US3] If any target test still fails after T013, diagnose the specific assertion (read the failing test expectation verbatim from `src/__tests__/lib/router/specialists.test.ts` or `src/__tests__/lib/router/router.test.ts`) and make the minimal prompt content or wrapper change required to satisfy it — do not change test files

**Checkpoint**: Full test suite passes. Verify SC-001 (zero regressions) and SC-002 (≥50% previously-failing tests now pass).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Consistency review and final validation across all changed prompts.

- [X] T015 [P] Review all five prompt files (`explain.ts`, `refactor.ts`, `test.ts`, `commit.ts`, `analyst.ts`) for: (1) terminology consistency — section names match contracts/prompt-api.md; (2) FR-010 anti-failure-mode coverage — each prompt includes at least one instruction against verbose preambles, missing sections, or inconsistent heading names; for `commit.ts` specifically, verify it has an explicit "no preamble" instruction (add one if absent — e.g. `"Output only the commit message. Do not add any explanation before or after it."`); no section accidentally renamed between US1 and US2 enrichments

- [X] T016 Run quickstart.md manual verification snippets against the updated `specialists.ts` wrappers to confirm commit-diff detection and test-framework inference work as documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (wrappers must be in place for testFramework inference to work)
- **US2 (Phase 4)**: Depends on Phase 3 (enrichments build on the structural foundation from US1)
- **US3 (Phase 5)**: Depends on Phase 4 — validates the complete set of changes
- **Polish (Phase 6)**: Depends on Phase 5 — final consistency pass

### Task Dependencies Within Phases

- T002 → T003 (RoutingDecision type needed before route() return statement)
- T003 → T005 (routeWithAnalyst must exist before api/route.ts can import it)
- T004 → independent (specialists.ts changes don't depend on types.ts changes)
- T006, T007, T008, T009 → independent of each other [P]
- T010, T011, T012 → independent of each other [P]; depend on T006, T007, T008 respectively

### Parallel Opportunities

```bash
# Phase 2 — run T004 in parallel with T002→T003→T005 chain:
Task A: T002 → T003 → T005 (types → index → api/route)
Task B: T004 (specialists wrappers — independent file)

# Phase 3 — all US1 prompt changes are parallel:
Task A: T006 (explain.ts)
Task B: T007 (refactor.ts)
Task C: T008 (test.ts)
Task D: T009 (analyst.ts)

# Phase 4 — all US2 enrichments are parallel:
Task A: T010 (explain.ts skill depth)
Task B: T011 (refactor.ts skill depth)
Task C: T012 (test.ts skill depth)

# Phase 6 — polish tasks are parallel:
Task A: T015 (terminology review)
Task B: T016 (quickstart verification)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Baseline validation
2. Complete Phase 2: Foundational routing fixes
3. Complete Phase 3: US1 prompt engineering best practices
4. **STOP and VALIDATE**: `pnpm test src/__tests__/lib/router/` — confirms 9 specialists + 8 router tests pass
5. Already satisfies SC-001, SC-002, SC-003, SC-004, SC-005

### Incremental Delivery

1. Phase 1 + Phase 2 → Router tests green (8 tests)
2. Phase 3 → Specialists tests green for format assertions (9 tests)
3. Phase 4 → Skill depth enrichments (no new test assertions, quality improvement)
4. Phase 5 → Full suite validation + any final fixes
5. Phase 6 → Polish

---

## Notes

- No test files should be modified — all fixes are in source files
- `buildXxxPrompt(context: CodeContext): string` signatures MUST NOT change
- `CodeContext` type MUST NOT change
- Skills are reference documents — not injected at runtime; used by developer during authoring
- `pnpm test` is the verification command (from CLAUDE.md)
