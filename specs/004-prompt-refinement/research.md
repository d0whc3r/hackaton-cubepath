# Research: Prompt Refinement with Skills

**Date**: 2026-03-22
**Branch**: `004-prompt-refinement`

---

## Decision 1: Prompt output format — Markdown vs Plain Text

**Decision**: Change all specialist prompts from "Use Markdown formatting" to "Use plain text. Do not use markdown."
**Rationale**: The `specialists.test.ts` tests assert `plain text` and `no markdown|without markdown|do not use markdown` appear in the prompt content. Additionally, plain text output is easier to parse downstream (no `##` noise), and the section contract can be enforced with labeled dividers rather than markdown headings.
**Alternatives considered**: Keeping Markdown and adding "plain text" elsewhere — rejected because the tests match on `no markdown`.

---

## Decision 2: Section label format for specialists

**Decision**: Use human-readable section labels (`What it does`, `Why it works`, `Example`, `Risks`) for explain; `Section 1: Executable tests` / `Section 2: Edge cases` for test (matching exact test expectations).
**Rationale**: The tests assert `prompt.toContain('Section 1')` and `prompt.toContain('Section 2')`, so the labels must include that exact text. For explain, the test asserts `Why it works` (not `How it works`), requiring a rename.
**Alternatives considered**: Keeping `##` markdown headers — rejected; tests require `plain text` and `no markdown`.

---

## Decision 3: testFramework inference in specialist wrapper

**Decision**: The `test` specialist wrapper in `specialists.ts` infers `testFramework` from `language` when `context.testFramework` is null or undefined, using the same language→framework mapping already in `analyst.ts`.
**Rationale**: `specialists.test.ts` passes `mockLang = { confidence: 'high', language: 'TypeScript' }` (no `testFramework` field). Current `buildTestPrompt` hits the pseudocode branch when `testFramework` is null. Wrapping the inference in the specialist keeps the `buildTestPrompt` signature unchanged.
**Alternatives considered**: Adding inference inside `buildTestPrompt` — would change the function's behavior for null testFramework even when explicitly desired; the specialist wrapper is the right seam.

---

## Decision 4: isDiff detection in commit specialist wrapper

**Decision**: The `commit` specialist wrapper enriches `context.isDiff` using a regex check against the raw `input` string when `context.isDiff` is not already `true`.
**Rationale**: Tests call `specialists.commit.buildSystemPrompt(mockLang, diffString)` where `mockLang` has no `isDiff`. The current implementation passes `context.isDiff` (undefined → falsy) and always emits the prose path. The second argument `input` is available in `buildSystemPrompt(context, input)` and must be used for diff detection when `context.isDiff` is not set.
**Alternatives considered**: Changing `buildCommitPrompt` to accept input — would change the prompt builder signature, which spec forbids.

---

## Decision 5: route() synchronous refactor for router.test.ts

**Decision**: Make `route()` synchronous (using `fallbackAnalysis` directly), and introduce `routeWithAnalyst()` as the async function used in production. Update `src/pages/api/route.ts` to use `routeWithAnalyst`.
**Rationale**: `router.test.ts` calls `const decision = route(...)` without `await`, meaning it expects `route` to be synchronous. Since Vitest runs tests as JS (no type enforcement), the tests succeed at the call site but `decision` is a Promise today. Making `route` sync and exposing the async version under a distinct name fixes all 8 router tests without modifying the test file.
**Alternatives considered**: Updating the test file to use `await` — spec says failing tests should be fixed by improving code, not test files. Adding optional params to the async `route` — conditional return types are brittle.

---

## Decision 6: detectedLanguage on RoutingDecision

**Decision**: Add `detectedLanguage: DetectedLanguage` to `RoutingDecision`, aliased from `codeContext`.
**Rationale**: `router.test.ts` checks `decision.detectedLanguage.language`. Current `RoutingDecision` only has `codeContext: CodeContext`. `DetectedLanguage` already exists in `types.ts` as `{ language: string; confidence: 'high'|'medium'|'low' }`, which is a subset of `CodeContext`.
**Alternatives considered**: Removing `codeContext` and replacing with `detectedLanguage` — would break `src/pages/api/route.ts` which reads `decision.codeContext.language`. Keeping both is backward-compatible.

---

## Decision 7: analyst prompt improvements (FR-011)

**Decision**: Enhance `buildAnalystSystemPrompt` with role clarity and explicit JSON-only instruction, and `buildAnalystUserPrompt` with better task-type disambiguation rules (distinguishing "explain" vs "refactor" vs "test") and clearer field definitions.
**Rationale**: FR-011 requires routing-specific improvements: clearer task type definitions, explicit disambiguation rules between similar tasks, and structured routing decision output. The current analyst prompt is functional but minimal — adding task type definitions improves routing accuracy.
**Alternatives considered**: Full analyst rewrite — out of scope; the analyst's JSON schema must stay the same since `runAnalyst` parses it. Only the instructional quality improves.

---

## Decision 8: legibility-first principle for refactor prompt

**Decision**: Add "legibility-first" principle to `buildRefactorPrompt` — instruct the model to explain *why* each change improves clarity, not just what changed.
**Rationale**: FR-004 and SC-005 require "legibility-first" principles and explaining the *why* of each change. `specialists.test.ts` asserts `prompt.toLowerCase().toContain('legib')`. The `clean-code` skill informs this: single-responsibility, clear naming, minimal nesting.
**Alternatives considered**: Separate "why" section — already present via `## Changes made`; just add legibility guidance there.

---

## Failing Tests Inventory

### specialists.test.ts — Expected failures fixed by this plan

| Test | Current state | Fix |
|------|---------------|-----|
| explain: instructs plain text output | FAIL — "Use Markdown" | Change to "plain text" + "no markdown" |
| explain: mentions four fixed sections "Why it works" | FAIL — has "How it works" | Rename to "Why it works" |
| test: instructs Vitest for TypeScript | FAIL — testFramework null | Infer in wrapper |
| test: instructs pytest for Python | FAIL — testFramework null | Infer in wrapper |
| test: specifies Section 1 / Section 2 | FAIL — uses `##` only | Add "Section 1"/"Section 2" labels |
| test: instructs plain text | FAIL — "Use Markdown" | Change to "plain text" |
| refactor: instructs plain text | FAIL — "Use Markdown" | Change to "plain text" |
| refactor: instructs legibility-first | FAIL — no "legib" | Add legibility instruction |
| commit-diff: detects diff + code changes | FAIL — isDiff undefined | Detect from input in wrapper |

### router.test.ts — Expected failures fixed by this plan

| Test | Current state | Fix |
|------|---------------|-----|
| routes explain task | FAIL — route is async, no await | Make route sync |
| routes test task | FAIL — same | Make route sync |
| routes refactor task | FAIL — same | Make route sync |
| routes commit task | FAIL — same | Make route sync |
| includes detected language | FAIL — route async + no detectedLanguage | Sync + add detectedLanguage |
| detects TypeScript language | FAIL — route async | Sync |
| includes systemPrompt | FAIL — route async | Sync |
| includes routingReason | FAIL — route async | Sync |
