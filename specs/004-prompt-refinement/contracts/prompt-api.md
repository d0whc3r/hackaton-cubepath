# Contract: Prompt Builder API

**Branch**: `004-prompt-refinement`
**Scope**: All specialist prompt builder functions

---

## Invariants (must hold after refinement)

1. All prompt builders accept `context: CodeContext` and return `string`.
2. No runtime skill injection — prompts are static strings.
3. `buildSystemPrompt(context, input)` in `SpecialistConfig` passes `context` and raw `input` to the builder.

---

## explain specialist contract

```
Input:  CodeContext { language, confidence, testFramework, isDiff }
Output: string

Required content:
  - "plain text" (case-insensitive)
  - matches /no markdown|without markdown|do not use markdown/ (case-insensitive)
  - contains "What it does"
  - contains "Why it works"
  - contains "Example"
  - contains "Risks"
  - contains language name (when language !== 'unknown')
  - does NOT contain "refactor" or "rewrite" (case-insensitive)
```

---

## test specialist contract

```
Input:  CodeContext { language, confidence, testFramework, isDiff }
Output: string

When language is known and testFramework is set:
  - "plain text" (case-insensitive)
  - contains framework name (e.g., "Vitest" for TypeScript, "pytest" for Python)
  - contains "Section 1"
  - contains "Section 2"

When language is 'unknown' or testFramework is null:
  - contains "pseudocode" (case-insensitive)
  - does NOT contain "Vitest"
  - does NOT contain "pytest"
```

Note: The `test` specialist wrapper infers `testFramework` from `language` when not provided in `CodeContext`.

---

## refactor specialist contract

```
Input:  CodeContext { language, confidence, testFramework, isDiff }
Output: string

Required content:
  - "plain text" (case-insensitive)
  - matches /legib/ (case-insensitive) — legibility-first principle
  - contains "Behavior preserved:"
  - does NOT contain "What it does" or "Why it works" (case-insensitive)
```

---

## commit specialist contract

```
Input:  CodeContext { language, confidence, testFramework, isDiff }
        + raw input string (from buildSystemPrompt second arg)
Output: string

When isDiff is true OR input matches diff pattern:
  - contains "diff" (case-insensitive)
  - contains "code changes" (case-insensitive)
  - contains "2 lines"
  - contains "not" AND matches /conventional commit|type prefix|feat:|fix:/ (case-insensitive)

When isDiff is false AND input does not match diff pattern:
  - contains "prose" (case-insensitive)
  - matches /conventional commit|type prefix|feat:|fix:/ (case-insensitive)

Always:
  - contains "plain text" (case-insensitive)
```

Note: The `commit` specialist wrapper detects isDiff from the raw `input` string using `/^diff --git|^@@\s/` when `context.isDiff` is not already `true`.

---

## analyst system prompt contract

```
Output: string

Required:
  - Clear role statement (code analyst / classifier)
  - Explicit JSON-only output instruction
  - Task type disambiguation (explain vs refactor vs test vs commit)
  - No execution or generation instructions
```

## analyst user prompt contract

```
Input:  taskType: string, input: string (first 1500 chars)
Output: string

Required:
  - JSON schema definition
  - Field rules for: language, confidence, testFramework, isDiff
  - Task-specific guidance for disambiguation
  - Code sample in delimited block
```

---

## RoutingDecision contract (extended)

```typescript
interface RoutingDecision {
  specialist: SpecialistConfig      // unchanged
  codeContext: CodeContext           // unchanged
  systemPrompt: string              // unchanged
  routingReason: string             // unchanged
  detectedLanguage: DetectedLanguage // NEW: { language, confidence } from codeContext
}
```

---

## route() function contract (sync)

```typescript
function route(
  taskType: TaskType,
  input: string,
  specialists: Record<TaskType, SpecialistConfig>
): RoutingDecision
```

Uses `fallbackAnalysis(input)` for code context. Synchronous.

## routeWithAnalyst() function contract (async)

```typescript
async function routeWithAnalyst(
  taskType: TaskType,
  input: string,
  specialists: Record<TaskType, SpecialistConfig>,
  analystModelId: string,
  baseUrl: string
): Promise<RoutingDecision>
```

Tries `runAnalyst`, falls back to `fallbackAnalysis` on failure/timeout.
