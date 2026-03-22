# Feature Specification: Prompt Refinement with Skills

**Feature Branch**: `004-prompt-refinement`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "hacer refine de los prompts usando skills para hacer mejores prompts"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apply Prompt Engineering Best Practices to All Specialist Prompts (Priority: P1)

A developer invokes any specialist task (explain, refactor, test, commit) and receives a response that is more precise, better structured, and more consistent than before. The improvement comes from applying systematic prompt engineering principles — such as clear role framing, explicit output format contracts, and chain-of-thought guidance — to the existing specialist prompts.

**Why this priority**: The existing prompts are functional but minimal. Applying prompt engineering best practices (from the `llm-prompt-optimizer` skill) directly improves output quality for every user, on every request. This is the highest-leverage change with the widest impact.

**Independent Test**: Can be tested by comparing the output of each specialist before and after refinement on a fixed input — the refined version should produce more structured, complete, and consistent responses. Each specialist prompt is independently reviewable.

**Acceptance Scenarios**:

1. **Given** the `explain` specialist receives a TypeScript function, **When** it generates an explanation, **Then** the response strictly follows the defined section structure, uses correct inline code formatting, and never omits a section.
2. **Given** the `refactor` specialist receives a function with clear improvement opportunities, **When** it generates a refactored version, **Then** the response includes the full refactored code block, a concise change list, and an explicit behavior-preservation statement — in that order, every time.
3. **Given** the `test` specialist receives TypeScript code, **When** it generates tests, **Then** the response produces runnable Vitest tests (not pseudocode), correctly using TypeScript syntax and Vitest idioms.
4. **Given** the `commit` specialist receives a git diff, **When** it generates a commit message, **Then** the output is plain text, imperative, under 72 characters, and contains no conventional-commit prefixes or markdown formatting.
5. **Given** any specialist prompt, **When** the same input is submitted multiple times, **Then** the structure of the response is consistent across runs — sections appear in the same order with the same headings.

---

### User Story 2 - Enrich Prompts with Domain-Specific Skill Knowledge (Priority: P2)

Each specialist prompt is enriched with relevant domain expertise drawn from the project's skill library. The `refactor` prompt incorporates clean-code and architecture principles; the `test` prompt incorporates testing patterns for the detected language and framework; the `explain` prompt incorporates code-review principles; the `commit` prompt incorporates commit message conventions.

**Why this priority**: Generic prompt engineering (US1) improves consistency and structure. Domain-specific enrichment improves the *substance* of the response — the refactor suggestions will align with actual best practices, the tests will follow real testing idioms, etc.

**Independent Test**: Can be tested by submitting a code snippet that has a known best-practice violation (e.g., a function with too many responsibilities) and verifying the specialist's response correctly identifies and addresses it using domain-appropriate guidance.

**Acceptance Scenarios**:

1. **Given** the `refactor` specialist receives a function with a long parameter list, **When** it suggests changes, **Then** the response applies recognizable clean-code principles (e.g., parameter objects, single responsibility) — not just surface-level renaming.
2. **Given** the `test` specialist receives JavaScript code, **When** it generates tests, **Then** the tests follow the AAA pattern (Arrange, Act, Assert) and cover both the happy path and primary error paths.
3. **Given** the `explain` specialist receives a complex algorithm, **When** it generates an explanation, **Then** the explanation covers not just what the code does but also potential risks and design tradeoffs — the same quality a senior code reviewer would provide.
4. **Given** the `commit` specialist receives a diff with multiple logical changes, **When** it generates a commit message, **Then** it either produces a focused single-concern title or explicitly flags that the diff should be split into multiple commits.

---

### User Story 3 - Validate Prompt Quality Against Existing Tests (Priority: P2)

After refinement, all existing prompt-related unit tests pass with the new prompt content. No behavioral regression is introduced — the refined prompts still produce output in the expected format, with the expected structure, satisfying all test assertions that were previously passing.

**Why this priority**: Prompt changes can silently break downstream consumers (test assertions, response parsers, UI renderers). Validating against the test suite ensures the refinement is a net improvement, not a trade-off.

**Independent Test**: Running the existing test suite (`pnpm test`) against the refined prompts should show zero regressions in previously-passing tests, and any previously-failing tests that can be fixed by the refinement should now pass.

**Acceptance Scenarios**:

1. **Given** the refined specialist prompts, **When** the full test suite is executed, **Then** all tests that were passing before refinement continue to pass.
2. **Given** tests that were previously failing due to prompt content mismatches (e.g., missing keywords, wrong format instructions), **When** the prompts are refined to match the intended behavior, **Then** those tests now pass.
3. **Given** any specialist prompt function signature, **When** it is called with a `CodeContext` object, **Then** it still returns a single string with the same function interface — no breaking API changes.

---

### Edge Cases

- What happens when the same skill concept conflicts between two domain skills (e.g., `clean-code` says "no comments" but `code-reviewer` includes commenting guidance)? The prompt author resolves the conflict by choosing the most appropriate guidance for that specialist's context; conflicts are documented in a decision note.
- How does prompt refinement behave for the `unknown` language path in `test` and `explain` specialists? Each specialist must maintain its existing fallback behavior for unknown languages; the refinement improves both the known and unknown paths.
- What if a refined prompt causes the model to generate responses that exceed a reasonable length budget? Prompts must include explicit length/conciseness guidance to prevent over-generation.
- What if a test that was previously failing reflects an incorrect expectation rather than a prompt bug? Those tests should be updated to reflect the correct intended behavior, documented in a decision note.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST apply prompt engineering best practices (role clarity, explicit output format contract, output length guidance, deterministic structure) to all five specialist prompt builders: `explain`, `refactor`, `test`, `commit`, and `analyst`. The first four follow a structured code-task output contract; the `analyst` follows a routing-specific approach (see FR-011).
- **FR-011**: The `analyst` prompt MUST be refined with a routing-specific approach: clearer task type definitions, explicit disambiguation rules between similar tasks (e.g., "refactor" vs "explain"), and a well-defined output format for the routing decision — not the code-task output contract pattern used by the other specialists.
- **FR-002**: Each refined prompt MUST include an explicit, labeled output section contract that specifies every section the model should produce, in order — eliminating ambiguity about response structure.
- **FR-003**: The `test` specialist prompt MUST explicitly name the test framework (Vitest for TypeScript, pytest for Python, etc.) and specify that tests must be executable and self-contained — not pseudocode — when the language is known.
- **FR-004**: The `refactor` specialist prompt MUST reference legibility-first refactoring principles and instruct the model to explain each change in plain, human-readable terms.
- **FR-005**: The `explain` specialist prompt MUST instruct the model to include risk and pitfall analysis as a required section of every response.
- **FR-006**: The `commit` specialist prompt MUST explicitly instruct the model to detect whether the input is a diff or prose description, and derive the commit message accordingly — the word "diff" or equivalent must appear in the prompt's diff-path instruction.
- **FR-007**: All refined prompts MUST maintain backward-compatible function signatures — each `buildXxxPrompt(context: CodeContext): string` function must continue to accept the same input and return a string.
- **FR-008**: The refinement MUST use the `llm-prompt-optimizer` skill as the primary guide for prompt engineering decisions, and at least one domain-specific skill per specialist as a secondary reference source — with the following documented exceptions: `commit` uses only `llm-prompt-optimizer` (no domain skill adds value beyond general prompt engineering for this task type); `analyst` uses only `llm-prompt-optimizer` (routing metadata extraction does not benefit from a domain-specific code skill).
- **FR-009**: The `test` specialist prompt MUST define two clearly labeled output sections: one for executable tests and one for edge cases — in that order.
- **FR-010**: Each specialist prompt MUST include explicit instructions against common failure modes: markdown formatting in plain-text outputs, missing sections, verbose preambles, and inconsistent heading names.

### Key Entities

- **Specialist Prompt**: A string returned by a `buildXxxPrompt()` function that serves as the system prompt for a specific task specialist. Has a task type, a language/framework context, and a structured output contract.
- **Skill**: A reference document in the `.agents/skills/` directory containing domain best practices, patterns, and guidance. Used as a knowledge source during prompt refinement — not executed at runtime.
- **CodeContext**: The input data structure passed to each prompt builder, containing `language`, `testFramework`, `isDiff`, and other task-specific fields.
- **Output Contract**: The explicit specification within a prompt that defines what sections the model must produce, in what order, with what format.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All previously-passing prompt-related unit tests continue to pass after refinement — zero regressions introduced.
- **SC-002**: At least 50% of all previously-failing tests in both `specialists.test.ts` and `router.test.ts` now pass after refinement — demonstrating measurable quality improvement across prompt content and routing behavior.
- **SC-003**: Each specialist prompt explicitly states its output contract (section names and order) — making the expected structure verifiable by reading the prompt alone, without running the model.
- **SC-004**: The `commit` specialist prompt contains the word "plain text" in its formatting instruction, and the `test` specialist prompt names the correct framework for TypeScript and Python inputs.
- **SC-005**: The `refactor` specialist prompt contains guidance aligned with legibility-first principles, producing responses that explain *why* each change was made — not just *what* changed.

## Assumptions

- The project has five specialist task types in scope: `explain`, `refactor`, `test`, `commit`, and `analyst`. The `translate` task uses a separate prompt path that is out of scope for this refinement.
- Skills in `.agents/skills/` are reference documents used as knowledge sources by the developer writing the prompts — they are not executed at runtime or injected into prompts dynamically.
- The refinement is a manual improvement of each prompt file, guided by skills. Automated prompt generation or dynamic skill injection is out of scope.
- The existing `CodeContext` type and the function signature `buildXxxPrompt(context: CodeContext): string` must not change — only the returned string content changes.
- Both `specialists.test.ts` (prompt content/format tests) and `router.test.ts` (routing logic and decision tests) failures are in scope. Any failing test in either file that can be fixed by improving prompt content or routing prompt instructions is a target for this feature.
- The primary skill reference for prompt engineering methodology is `.agents/skills/llm-prompt-optimizer/SKILL.md`.
- Domain-specific skill references per specialist: `explain` → `code-reviewer`, `refactor` → `clean-code` + `architecture-patterns`, `test` → `javascript-testing-patterns`, `commit` → no specific domain skill needed beyond general prompt engineering.

## Clarifications

### Session 2026-03-22

- Q: Should the refinement include dynamic skill injection into prompts at runtime? → A: No — skills are reference documents used by the developer during the prompt writing process, not runtime injections. The output is improved static prompt strings.
- Q: Is the `analyst` prompt (used for task routing) in scope? → A: Yes, all five specialists including `analyst` are in scope; `translate` is explicitly out of scope.
- Q: Should fixing `router.test.ts` failures be part of this feature? → A: Yes — both `specialists.test.ts` and `router.test.ts` failing tests are in scope. Any failure fixable by improving prompt content or routing prompt instructions is a target.
- Q: Should the `analyst` prompt follow the same output contract pattern as the other specialists? → A: No — routing-specific approach: improve task type definitions, disambiguation rules between similar tasks, and routing decision output format. Do not apply the code-task structured section pattern.
