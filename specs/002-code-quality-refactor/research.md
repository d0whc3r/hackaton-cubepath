# Research: Code Quality & Refactor

**Feature**: 002-code-quality-refactor
**Date**: 2026-03-22
**Status**: Complete — all decisions resolved

---

## Decision 1: React Compiler Integration

**Decision**: Install `babel-plugin-react-compiler@1.0.0` as a devDependency; configure it as a Babel plugin in both `@astrojs/react` (Astro build) and `@vitejs/plugin-react` (Vitest test runner).

**Rationale**: React 19 ships with the compiler runtime built-in — no additional runtime package is needed. The compiler performs static analysis to automatically insert memoisation at compile time, eliminating the need for manual `useCallback`/`useMemo`. This is more precise than manual memoisation (humans over- or under-memoize; the compiler does not). React Compiler 1.0.0 is stable and production-ready as of 2024.

**Configuration required**:

```typescript
// astro.config.ts — add babel option to react integration
react({
  babel: {
    plugins: [['babel-plugin-react-compiler']],
  },
})

// vitest.config.ts — add babel option to @vitejs/plugin-react
react({
  babel: {
    plugins: [['babel-plugin-react-compiler']],
  },
})
```

**Alternatives considered**:
- Manual `useCallback`/`useMemo` with referential-stability rule — rejected: error-prone, diverges from the compiler's more precise static analysis, adds cognitive overhead
- Profile-driven memoisation — rejected: requires runtime profiling tooling outside current project setup

**Action required**: Remove ALL existing `useMemo` and `useCallback` calls from the codebase. The compiler replaces them entirely.

---

## Decision 2: Cyclomatic Complexity Enforcement

**Decision**: Add oxlint complexity rule (`max-params` and `complexity`) to `oxlint.config.ts` with threshold of 5 per function, enforced at lint time.

**Rationale**: oxlint is already the project's linter (v1.56.0). Adding the `complexity` rule enforces SC-001 automatically in CI without adding a separate tool. Threshold of 5 is conservative and industry-standard for clean code.

**Configuration**:
```json
{
  "rules": {
    "complexity": ["error", 5]
  }
}
```

**Alternatives considered**:
- ESLint with `eslint-plugin-complexity` — rejected: project uses oxlint exclusively; mixing linters violates FR-009
- Manual code review only — rejected: not mechanically verifiable, violates SC-001

---

## Decision 3: Custom Hook Extraction Strategy

**Decision**: Extract business logic from components into co-located hooks using the naming pattern `use-[concern].ts`. Place shared hooks in `src/hooks/`; component-specific hooks are co-located in the component's directory.

**Rationale**: The model config page already demonstrates the correct pattern (`use-model-config-page.ts` composing 4 sub-hooks). Apply the same pattern to `ChatContainer` and `ChatInput`, which currently embed logic inline.

**Hooks to extract**:

| New Hook | Source Component | Concern Encapsulated |
|----------|-----------------|----------------------|
| `src/hooks/use-chat-session.ts` | `ChatContainer` | Conversation state, persistence effect, abort controller, route mutation, all handlers |
| `src/hooks/use-chat-input.ts` | `ChatInput` | Submit logic, keyboard shortcut handler, derived display values |
| `src/hooks/use-file-attachment.ts` | `ChatInput` | FileReader API, attached file state, file removal |

**Alternatives considered**:
- Single monolithic `useChatContainer` hook — rejected: too broad, single-responsibility violated
- Keep logic in component, add tests via shallow render — rejected: testing internal state is fragile

---

## Decision 4: API Route Handler Decomposition

**Decision**: Decompose `buildSSEStream` in `src/pages/api/route.ts` into named sub-functions, each responsible for exactly one streaming step. The handler orchestrates calls to these functions without embedding step logic.

**Functions to extract** (all within `route.ts` module scope — not exported, no new files needed):

| Function | Responsibility |
|----------|---------------|
| `emitLanguageDetection(decision, emit)` | Emit detecting_language routing steps |
| `emitTaskAnalysis(taskType, emit)` | Emit analyzing_task routing steps |
| `emitSpecialistSelection(decision, emit)` | Emit selecting_specialist steps + specialist_selected event |
| `streamSpecialistResponse(ollama, decision, req, emit, signal)` | Streaming loop + token-limit continuation + cost emission |

**Rationale**: `buildSSEStream` is ~100 lines with 4 nested try/catch blocks and 4 distinct concerns. Each step is independently testable after extraction. The outer function becomes an orchestrator of ~20 lines.

**Additionally**: `runAnalyst` in `analyst.ts` creates its own `ollamaClient` duplicate. It should import and use the shared `ollamaClient` from `src/lib/api/sse.ts`.

**Alternatives considered**:
- Move steps to separate files — rejected: over-engineering; steps are only used in one route handler
- Leave as-is with better comments — rejected: doesn't reduce cyclomatic complexity

---

## Decision 5: Astro Page Deduplication

**Decision**: The 4 task pages (`commit.astro`, `explain.astro`, `refactor.astro`, `test.astro`) follow an identical structure. The existing `AppLayout.astro` already provides the outer shell. No further extraction is needed — the pages are already minimal (5 lines each). Focus is on comment hygiene and verifying no duplication has crept in.

**Rationale**: Reviewing the commit page shows it's already as lean as possible:
```astro
---
import AppLayout from '@/layouts/AppLayout.astro'
import { TaskApp } from '@/components/chat/TaskApp'
---
<AppLayout ...>
  <TaskApp client:load fixedTaskType="commit" ... />
</AppLayout>
```
There is no meaningful duplication to extract that wouldn't create a more complex abstraction than the original. The `AppLayout` + `TaskApp` composition IS the shared abstraction.

**Alternatives considered**:
- Create a `TaskPageLayout.astro` wrapping both — rejected: adds indirection without reducing code; 5-line pages are already the abstraction minimum

---

## Decision 6: Comment Hygiene Standard

**Decision**: Apply the "Why, not What" rule: a comment is valid only if removing it would make a non-obvious decision invisible. Delete all other comments.

**Examples of comments to DELETE** (found in codebase):
- `// Each task has its own isolated history` — removed; variable name `loadHistory(taskType)` is self-evident
- `// Persist to the task-specific key whenever entries change` — removed; the `useEffect` callback says this
- `// Clear history — only shown when there are entries` — removed; the `entries.length > 0` condition is self-evident
- `// ── Step 1: Analyst analyses the code ──────────────────` — remove decorative dividers; use function extraction instead

**Examples of comments to KEEP** (non-obvious decisions):
- Explanation of why `min-h-0` is required on a flex child (CSS flexbox non-obvious gotcha)
- Explanation of the Analyst → fallback architecture in `route()` (architectural decision)
- The JSDoc on `createSseStream` explaining the stream close guarantee
- The `ANALYST_TIMEOUT_MS = 8000` timeout — worth documenting _why_ 8s (model cold start + network)
- The 5-minute timeout in `buildSSEStream` — document why 300_000ms is the right value
- The `Auto-continue when model hit token limit` comment — KEEP, explains non-obvious business logic

---

## Decision 7: Test Architecture for Extracted Units

**Decision**: Write unit tests for each extracted hook using `@testing-library/react`'s `renderHook`. Tests live alongside existing tests in `src/__tests__/hooks/`.

**Test coverage targets**:
- `use-chat-session.ts`: conversation state init, handleSubmit creates entry + triggers mutation, handleCancel sets interrupted status, handleClearHistory resets entries, persistence effect
- `use-chat-input.ts`: submit validates empty input, submit validates over-limit, keyboard shortcut triggers submit
- `use-file-attachment.ts`: file read sets content + name, removeFile clears both, file content truncated at MAX_CHARS

**Alternatives considered**:
- Integration tests via component rendering — supplementary, not primary; hooks should be testable in isolation
- Snapshot tests — rejected: brittle for logic testing, provides no behavioral guarantees

---

## Patterns Applied (Summary)

| Pattern | Applied To | Purpose |
|---------|-----------|---------|
| Custom Hook | ChatContainer → useChatSession, ChatInput → useChatInput + useFileAttachment | Extract logic, enable isolation testing |
| Single Responsibility | All components, all functions | Max cyclomatic complexity ≤ 5 |
| Adapter | ollamaClient (already) — deduplicate analyst.ts usage | Single creation point for Ollama client |
| Factory | buildSSEStream, buildSpecialists, buildRouteMutationOptions (already) | Document and reinforce existing pattern |
| Strategy | Router specialist selection (already) | Document the existing pattern |
| Orchestrator | Refactored buildSSEStream calling named step functions | Reduce to pure orchestration logic |
| Compiler-driven memoisation | React Compiler replaces all manual useCallback/useMemo | Zero manual memoisation |
