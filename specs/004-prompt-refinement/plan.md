# Implementation Plan: Prompt Refinement with Skills

**Branch**: `004-prompt-refinement` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-prompt-refinement/spec.md`

## Summary

Refine all five specialist prompts (`explain`, `refactor`, `test`, `commit`, `analyst`) by applying prompt engineering best practices from the `llm-prompt-optimizer` skill and domain-specific skills per specialist. Fix 9 failing `specialists.test.ts` tests (prompt content) and 8 failing `router.test.ts` tests (structural interface mismatch: sync vs async route, missing `detectedLanguage` on decision). All changes are to prompt strings and the specialist/router wiring layer; `CodeContext` and `buildXxxPrompt` function signatures remain unchanged.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode)
**Primary Dependencies**: Vitest (testing), AI SDK (`ai` package)
**Storage**: N/A
**Testing**: Vitest + happy-dom
**Target Platform**: Node.js (Astro SSR + browser client)
**Project Type**: Web application (Astro + React)
**Performance Goals**: N/A — prompt strings are static; no runtime overhead
**Constraints**: Function signatures `buildXxxPrompt(context: CodeContext): string` must not change; `CodeContext` type must not change
**Scale/Scope**: 5 specialist prompts + 2 router functions

## Constitution Check

The project constitution is a template (not yet filled in with project-specific principles). No constitution violations to flag. All changes are localized to prompt strings and routing wiring — minimal blast radius.

## Project Structure

### Documentation (this feature)

```text
specs/004-prompt-refinement/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── prompt-api.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (affected files)

```text
src/lib/prompts/
├── explain.ts           # CHANGE: plain text, Why it works, risk section
├── refactor.ts          # CHANGE: plain text, legibility-first
├── test.ts              # CHANGE: plain text, Section 1/2 labels
├── commit.ts            # CHANGE: minimal (already mostly correct)
└── analyst.ts           # CHANGE: clearer routing instructions (FR-011)

src/lib/router/
├── types.ts             # CHANGE: add detectedLanguage to RoutingDecision
├── index.ts             # CHANGE: route() → sync; add routeWithAnalyst()
└── specialists.ts       # CHANGE: wrappers pass input, infer testFramework, detect isDiff

src/pages/api/
└── route.ts             # CHANGE: use routeWithAnalyst() instead of route()
```

## Complexity Tracking

No constitution violations.

---

## Phase 0: Research

**Status**: Complete — see [research.md](./research.md)

Key decisions:
1. All specialist prompts switch from Markdown to plain-text output format
2. Section labels use human-readable names (not `##` headers) with exact strings matching test assertions
3. `test` specialist wrapper infers `testFramework` from `language` when null
4. `commit` specialist wrapper detects `isDiff` from raw `input` regex when `context.isDiff` is not set
5. `route()` becomes synchronous; `routeWithAnalyst()` is the new async production function
6. `RoutingDecision` gains `detectedLanguage: DetectedLanguage` field

---

## Phase 1: Implementation Plan

### Task group 1: Update explain prompt (FR-001, FR-002, FR-005, SC-003)

**File**: `src/lib/prompts/explain.ts`

Changes:
- Replace `"Use Markdown formatting in your response."` with `"Use plain text. Do not use markdown formatting."`
- Rename `"How it works"` → `"Why it works"` throughout
- Replace `## ` section headers with plain text labels (the prompt defines section *names* the model must use, not markdown syntax)
- Add risk/pitfall analysis instruction as required section (already present as "Risks & pitfalls")
- Add explicit instruction against verbose preambles and missing sections

**Skill guidance applied**:
- `llm-prompt-optimizer` RSCIT: Role (expert engineer), Constraints (plain text, 4 sections), Template (labeled sections)
- `code-reviewer`: risk analysis, design tradeoffs as required output

**Before** (section excerpt):
```
Use Markdown formatting in your response. Structure it in exactly this order:
## What it does
...
## How it works
...
```

**After** (section excerpt):
```
Use plain text. Do not use markdown formatting.
Structure your response using exactly these four labeled sections in this order:

What it does
...
Why it works
...
Example
...
Risks
...
```

**Test assertions satisfied**:
- `prompt.toLowerCase().toContain('plain text')` ✓
- `prompt.toLowerCase().toMatch(/no markdown|without markdown|do not use markdown/)` ✓ ("do not use markdown")
- `prompt.toContain('What it does')` ✓
- `prompt.toContain('Why it works')` ✓
- `prompt.toContain('Example')` ✓
- `prompt.toContain('Risks')` ✓

---

### Task group 2: Update refactor prompt (FR-001, FR-002, FR-004, SC-003, SC-005)

**File**: `src/lib/prompts/refactor.ts`

Changes:
- Replace `"Use Markdown formatting"` with `"Use plain text."`
- Add legibility-first principle: "Focus on legibility and readability. For each change, explain *why* it improves clarity — not just what changed."
- Replace `##` section labels with plain text labels (keeping same section structure)
- Add explicit instruction against verbose preamble

**Skill guidance applied**:
- `llm-prompt-optimizer`: output contract, length constraint
- `clean-code`: single responsibility, legible naming, explain the why
- `architecture-patterns`: legibility as primary refactoring goal

**Test assertions satisfied**:
- `prompt.toLowerCase().toContain('plain text')` ✓
- `prompt.toLowerCase().toContain('legib')` ✓ (via "legibility")
- `prompt.toContain('Behavior preserved:')` ✓ (kept from current)

---

### Task group 3: Update test prompt (FR-001, FR-002, FR-003, FR-009, SC-003, SC-004)

**File**: `src/lib/prompts/test.ts`

Changes:
- Replace `"Use Markdown formatting"` with `"Use plain text."`
- Rename `"## Executable tests"` → `"Section 1: Executable tests"`
- Rename `"## Edge cases"` → `"Section 2: Edge cases"`
- Add explicit instruction that tests must be runnable (not pseudocode) when framework is known
- Preserve pseudocode path for unknown language

**Skill guidance applied**:
- `llm-prompt-optimizer`: output contract, framework-specific instructions
- `javascript-testing-patterns`: AAA pattern, self-contained tests, framework naming

**Test assertions satisfied**:
- `prompt.toContain('Vitest')` ✓ (via testFramework, now inferred in wrapper)
- `prompt.toContain('pytest')` ✓ (via testFramework)
- `prompt.toContain('Section 1')` ✓
- `prompt.toContain('Section 2')` ✓
- `prompt.toLowerCase().toContain('plain text')` ✓
- Unknown path: `prompt.toLowerCase().toContain('pseudocode')` ✓ (unchanged)

---

### Task group 4: Update commit prompt (FR-001, FR-002, FR-006, SC-003, SC-004)

**File**: `src/lib/prompts/commit.ts`

The current commit prompt already has "plain text", "2 lines", "conventional commit", "prose" (prose path). The only change needed is ensuring the wording for the diff path explicitly says "diff" and "code changes" (which it already does). Review and verify — minimal change needed.

**Already present**:
- "plain text only" ✓
- "diff" (in diff path: "The input is a git diff") ✓
- "code changes" (in diff path: "Derive the commit message from the actual code changes") ✓
- "prose" (in prose path: "The input is a prose description") ✓
- "2 lines" ✓
- "conventional commit" (in the Do NOT line) ✓

The commit prompt is already well-formed. Only the specialist wrapper needs updating for isDiff detection (Task group 6).

---

### Task group 5: Update analyst prompt (FR-011)

**File**: `src/lib/prompts/analyst.ts`

Changes to `buildAnalystSystemPrompt`:
- Add task type definitions: explain = "understand what code does", refactor = "improve code quality/structure", test = "generate tests for code", commit = "write git commit message from diff or description"
- Add explicit disambiguation: "If the task is 'explain', focus on language detection. If 'test', identify the test framework."
- Keep JSON-only output instruction

Changes to `buildAnalystUserPrompt`:
- Improve field rules with task-specific guidance
- Add examples for ambiguous inputs (diff vs prose for commit)

**Skill guidance applied**:
- `llm-prompt-optimizer`: RSCIT, structured JSON output pattern, reduce hallucination

---

### Task group 6: Update specialists wrappers (test inference, commit isDiff)

**File**: `src/lib/router/specialists.ts`

Changes:
1. Add `inferTestFramework(language: string): string | null` helper (same mapping as `defaultFramework` in `analyst.ts`)
2. For `test` specialist: `buildSystemPrompt: (context, input) => buildTestPrompt({ ...context, testFramework: context.testFramework ?? inferTestFramework(context.language) })`
3. For `commit` specialist: `buildSystemPrompt: (context, input) => buildCommitPrompt({ ...context, isDiff: context.isDiff || /^diff --git|^@@\s/.test(input.trimStart()) })`
4. All other specialists: explicitly pass `input` as second arg (even if unused) for interface consistency

**Test assertions satisfied** (via enriched context):
- test TypeScript → `testFramework: 'Vitest'` → `prompt.toContain('Vitest')` ✓
- test Python → `testFramework: 'pytest'` → `prompt.toContain('pytest')` ✓
- commit diff → `isDiff: true` → `prompt.toLowerCase().toContain('diff')` ✓
- commit diff → `prompt.toLowerCase().toContain('code changes')` ✓

---

### Task group 7: Fix route() sync/async split (router.test.ts fixes)

**File**: `src/lib/router/index.ts`

Changes:
1. Rename the existing `route` (async, uses analyst) to `routeWithAnalyst`
2. Add a new sync `route` function:
   ```typescript
   export function route(
     taskType: TaskType,
     input: string,
     specialists: Record<TaskType, SpecialistConfig>
   ): RoutingDecision {
     const codeContext = fallbackAnalysis(input)
     const specialist = specialists[taskType]
     const systemPrompt = specialist.buildSystemPrompt(codeContext, input)
     return {
       codeContext,
       detectedLanguage: { language: codeContext.language, confidence: codeContext.confidence },
       routingReason: `${taskType} → ${specialist.displayName}`,
       specialist,
       systemPrompt,
     }
   }
   ```

**File**: `src/lib/router/types.ts`

Changes:
- Add `detectedLanguage: DetectedLanguage` to `RoutingDecision`

**File**: `src/pages/api/route.ts`

Changes:
- Import `routeWithAnalyst` instead of `route`
- Change `const decision = await route(...)` → `const decision = await routeWithAnalyst(...)`

**Test assertions satisfied** (all 8 router tests):
- `route(...)` is synchronous → `decision` is not a Promise ✓
- `decision.specialist.id === 'explanation-specialist'` ✓
- `decision.detectedLanguage.language === 'TypeScript'` ✓
- `typeof decision.systemPrompt === 'string'` ✓
- `typeof decision.routingReason === 'string'` ✓

---

## Success Criteria Mapping

| SC | Requirement | Implementation |
|----|------------|----------------|
| SC-001 | Zero regressions in previously-passing tests | All currently-passing tests remain; only new cases added |
| SC-002 | ≥50% of previously-failing tests now pass | 9/9 specialists + 8/8 router = 17/17 target failures fixed |
| SC-003 | Each prompt explicitly states output contract | Section labels in all 4 specialist prompts |
| SC-004 | commit has "plain text"; test names framework | Already present in commit; added in test via wrapper |
| SC-005 | refactor has legibility-first guidance | "legibility" and "why each change" added to refactor |

## Task Execution Order

```
T1: Update src/lib/prompts/explain.ts
T2: Update src/lib/prompts/refactor.ts
T3: Update src/lib/prompts/test.ts
T4: Verify src/lib/prompts/commit.ts (no change needed)
T5: Update src/lib/prompts/analyst.ts
T6: Update src/lib/router/types.ts (add detectedLanguage)
T7: Update src/lib/router/index.ts (sync route + routeWithAnalyst)
T8: Update src/lib/router/specialists.ts (wrappers + inferTestFramework)
T9: Update src/pages/api/route.ts (use routeWithAnalyst)
T10: Run pnpm test and verify zero regressions + all target tests pass
```

T1–T5 are independent (different files). T6 must precede T7 (RoutingDecision used in route return). T8–T9 can run after T7.
