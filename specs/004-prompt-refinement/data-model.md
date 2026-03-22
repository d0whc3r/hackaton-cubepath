# Data Model: Prompt Refinement

**Date**: 2026-03-22
**Branch**: `004-prompt-refinement`

---

## Core Entities

### CodeContext
Input data structure passed to each prompt builder. **Unchanged by this feature.**

| Field | Type | Description |
|-------|------|-------------|
| `language` | `string` | Detected programming language (e.g., "TypeScript", "Python", "unknown") |
| `confidence` | `'high' \| 'medium' \| 'low'` | Analyst confidence in detection |
| `testFramework` | `string \| null` | Test framework for language (e.g., "Vitest", "pytest") |
| `isDiff` | `boolean` | True when input looks like a git diff |

### SpecialistPrompt
The string returned by a `buildXxxPrompt()` function. After refinement, every specialist prompt satisfies:

| Constraint | Applies to |
|-----------|-----------|
| Contains "plain text" | explain, test, refactor |
| Contains "no markdown" / "do not use markdown" | explain |
| Contains labeled output sections | all except analyst |
| Contains "legib" (legibility) | refactor |
| Contains "Vitest" for TypeScript / "pytest" for Python | test |
| Contains "Section 1" / "Section 2" | test |
| Contains "Why it works" | explain |
| Contains "diff" + "code changes" for diff input | commit |
| Contains "prose" for prose input | commit |
| Contains "Behavior preserved:" | refactor |
| Contains "plain text only" | commit |

### SpecialistConfig
Configuration object per task type. `buildSystemPrompt` signature unchanged.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Hardcoded identifier (e.g., "explanation-specialist") |
| `displayName` | `string` | Human-readable name |
| `modelId` | `string` | Ollama model identifier |
| `buildSystemPrompt` | `(context: CodeContext, input: string) => string` | Builds the system prompt from code context + raw input |

**Change**: Specialist wrappers now use `input` (second param) to:
- Infer `testFramework` from `language` when `context.testFramework` is null/undefined (test)
- Detect `isDiff` from raw input regex when `context.isDiff` is not true (commit)

### RoutingDecision
Result of routing a task. Extended with `detectedLanguage`.

| Field | Type | Status |
|-------|------|--------|
| `specialist` | `SpecialistConfig` | Unchanged |
| `codeContext` | `CodeContext` | Unchanged |
| `systemPrompt` | `string` | Unchanged |
| `routingReason` | `string` | Unchanged |
| `detectedLanguage` | `DetectedLanguage` | **NEW** — alias for `{ language: codeContext.language, confidence: codeContext.confidence }` |

### DetectedLanguage
Existing type. Exposed on RoutingDecision for test compatibility.

| Field | Type |
|-------|------|
| `language` | `string` |
| `confidence` | `'high' \| 'medium' \| 'low'` |

---

## Function Contracts

### buildExplainPrompt(context: CodeContext): string
- Signature: **unchanged**
- Output contract: plain text, 4 labeled sections in order: "What it does", "Why it works", "Example", "Risks"
- Must NOT contain "refactor" or "rewrite"
- Must contain "plain text" and "no markdown"

### buildRefactorPrompt(context: CodeContext): string
- Signature: **unchanged**
- Output contract: plain text, 3 labeled sections: "Refactored code", "Changes made", "Behavior note"
- Must contain "legib" (legibility-first principle)
- Must contain "plain text"
- Must contain "Behavior preserved:"

### buildTestPrompt(context: CodeContext): string
- Signature: **unchanged**
- When language known: plain text, 2 labeled sections "Section 1: Executable tests", "Section 2: Edge cases"
- When language unknown: pseudocode path (unchanged)
- Must contain "plain text"

### buildCommitPrompt(context: CodeContext): string
- Signature: **unchanged**
- For diff context: contains "diff", "code changes", "plain text"
- For prose context: contains "prose", "plain text"
- Must NOT contain conventional commit instructions in positive form
- Must contain "2 lines" length constraint

### buildAnalystSystemPrompt(): string
- Signature: **unchanged**
- Enhanced: explicit JSON-only, role clarity, task type disambiguation guidance

### buildAnalystUserPrompt(taskType: string, input: string): string
- Signature: **unchanged**
- Enhanced: clearer field rules, explicit examples for ambiguous task types

---

## Route Functions

### route(taskType, input, specialists): RoutingDecision (SYNC)
- **Refactored to synchronous** — uses `fallbackAnalysis` directly
- Returns `RoutingDecision` (not Promise)
- Used by: `router.test.ts`

### routeWithAnalyst(taskType, input, specialists, analystModelId, baseUrl): Promise<RoutingDecision> (ASYNC)
- **New** — extracted from old `route`
- Uses `runAnalyst` with timeout fallback to `fallbackAnalysis`
- Used by: `src/pages/api/route.ts`
