# Implementation Plan: Railguard Security Protection

**Branch**: `007-railguard-security` | **Date**: 2026-03-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/007-railguard-security/spec.md`

---

## Summary

Add a server-side railguard layer that validates all user inputs before they reach the AI routing layer. The guard checks inputs against a typed, registry-based rule set, blocks adversarial prompts (role-play overrides, instruction injection, encoding bypass, persona switches, prompt flooding), logs sanitised validation events to an in-memory buffer, and exposes security metrics. All legitimate inputs pass through unchanged. Rules are defined in a single maintainable TypeScript module and backed by a comprehensive adversarial test suite.

---

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode)
**Primary Dependencies**: Astro 6.0.8, React 19, wretch 3.0.7, ai SDK 6.0.134 (Ollama provider), Zod, Vitest 4.1.0
**Storage**: In-memory circular buffer (max 1,000 entries) for `ValidationEvent` log; no persistent store
**Testing**: Vitest 4.1.0 + happy-dom; MSW 2.x for existing HTTP tests (not needed for railguard pure functions)
**Target Platform**: Astro SSR server (Node.js)
**Project Type**: Web application (Astro SSR + React 19 frontend)
**Performance Goals**: No strict latency limit — correctness takes priority over speed (clarification Q1)
**Constraints**: Fail-closed on validator error; 30-day log retention enforced on append; 100-char PII-redacted excerpt for logs
**Scale/Scope**: Small-to-medium developer audience; no external log aggregation required

---

## Constitution Check

The project constitution file is a placeholder template with no project-specific gates defined. No violations to evaluate. Standard TypeScript strict-mode and test-first conventions apply per `CLAUDE.md`.

---

## Project Structure

### Documentation (this feature)

```text
specs/007-railguard-security/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── railguard.ts     # Phase 1 output — public interface contract
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (new files this feature adds)

```text
src/lib/railguard/
├── types.ts             # AttackVectorCategory, RailguardRule, ValidationResult,
│                        # ValidationEvent, SecurityMetrics
├── rules.ts             # RAILGUARD_RULES registry (initial rule set, 5 categories)
├── sanitise.ts          # sanitise(input): string — truncate + PII redaction
├── validator.ts         # validateInput(input, rules?): ValidationResult
├── event-log.ts         # appendEvent(), pruneOlderThan(), getMetrics()
└── index.ts             # public re-exports

src/__tests__/lib/railguard/
├── role-play-override.test.ts
├── instruction-injection.test.ts
├── encoding-bypass.test.ts
├── persona-switch.test.ts
├── prompt-flooding.test.ts
├── benign.test.ts       # SC-002: 0% false positive rate
├── sanitise.test.ts
├── event-log.test.ts
└── validator.test.ts    # fail-closed, rule toggle, partial-adversarial blocking
```

### Source Code (existing files modified)

```text
src/pages/api/route.ts   # Add validateInput() call after Zod parse, before routing
```

**Structure Decision**: Single-project layout. The railguard is a new library-style module under `src/lib/railguard/` following the existing `src/lib/` conventions (router, schemas, config, etc.). Tests go under `src/__tests__/lib/railguard/` following the existing test directory structure.

---

## Implementation Phases

### Phase 1 — Core Railguard Module (no integration yet)

**Goal**: Deliverable pure functions that can be tested in isolation before touching the API route.

**Files to create**:

1. `src/lib/railguard/types.ts`
   - Export: `AttackVectorCategory` (union type), `RailguardRule`, `ValidationResult`, `ValidationEvent`, `SecurityMetrics`
   - All types match the contract in `specs/007-railguard-security/contracts/railguard.ts`

2. `src/lib/railguard/sanitise.ts`
   - Export: `sanitise(input: string): string`
   - Truncate to 100 chars, then replace RFC 5322 email and E.164 phone patterns with `[REDACTED]`
   - Must not throw

3. `src/lib/railguard/rules.ts`
   - Export: `RAILGUARD_RULES: RailguardRule[]`
   - Initial rules — at least 3 rules per category (5 categories × ≥3 rules = ≥15 rules)
   - All `status: "active"` in the initial set

4. `src/lib/railguard/validator.ts`
   - Export: `validateInput(input: string, rules?: RailguardRule[]): ValidationResult`
   - Iterates active rules only; short-circuits on first match
   - Wraps in try/catch and returns `{ decision: "blocked", ... }` on any internal error (fail-closed)
   - Blocked result includes `matchedRuleId`, `attackVectorCategory`, `blockReason`

5. `src/lib/railguard/event-log.ts`
   - Module-level in-memory store (array, max 1,000 entries)
   - Export: `appendEvent(event: ValidationEvent): void` — prunes before appending
   - Export: `pruneOlderThan(days: number): void`
   - Export: `getMetrics(windowStart: Date, windowEnd: Date): SecurityMetrics`
   - Export: `getEvents(): ReadonlyArray<ValidationEvent>` (for testing inspection)

6. `src/lib/railguard/index.ts`
   - Re-exports: `validateInput`, `sanitise`, `appendEvent`, `pruneOlderThan`, `getMetrics`
   - Re-exports all types from `types.ts`

---

### Phase 2 — Adversarial Test Suite

**Goal**: Verify the rule set achieves ≥90% block rate and 0% false positive rate before integration.

**Files to create** (all in `src/__tests__/lib/railguard/`):

- `role-play-override.test.ts` — ≥3 adversarial cases + ≥1 benign
- `instruction-injection.test.ts` — ≥3 adversarial cases + ≥1 benign
- `encoding-bypass.test.ts` — ≥3 adversarial cases + ≥1 benign
- `persona-switch.test.ts` — ≥3 adversarial cases + ≥1 benign
- `prompt-flooding.test.ts` — ≥3 adversarial cases + ≥1 benign
- `benign.test.ts` — ≥10 representative legitimate developer inputs, all must return `"allowed"`
- `sanitise.test.ts` — email/phone redaction, truncation, no-throw on empty/long input
- `event-log.test.ts` — append, prune (30-day retention), buffer cap (1,000), metrics computation
- `validator.test.ts` — fail-closed on error, inactive rule is skipped, mixed (partial adversarial) input is fully blocked

**Success gate**: `npm test` passes with all test files. Block rate across adversarial suite ≥90%. False positive rate on benign suite = 0%.

---

### Phase 3 — API Route Integration

**Goal**: Connect the railguard to the live request path.

**File to modify**: `src/pages/api/route.ts`

**Change**: After `RouteRequestSchema.safeParse(rawBody)` succeeds and before `resolveModel()` / routing is called, add:

```typescript
// [railguard] validate input before routing
const validation = validateInput(parsedBody.input);
const event = buildValidationEvent(validation, parsedBody.input);
appendEvent(event);

if (validation.decision === "blocked") {
  return new Response(
    JSON.stringify({ error: "Input blocked by security policy." }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

A `buildValidationEvent(result, rawInput)` helper (co-located in `event-log.ts` or `validator.ts`) creates a `ValidationEvent` from the result, using `sanitise(rawInput)` for the excerpt and `crypto.randomUUID()` for the ID.

**No other files are modified.**

---

### Phase 4 — Integration Test

**File to create**: `src/__tests__/lib/railguard/integration.test.ts` (or extend `validator.test.ts`)

**Scope**: End-to-end flow — adversarial input → `validateInput()` → `appendEvent()` → `getMetrics()` — confirming the full pipeline produces a logged, measurable blocked event.

Does **not** require MSW or HTTP; tests the pure module chain only.

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Validation placement | Server-side in `route.ts`, after Zod, before routing | Single chokepoint; client-side is bypassable |
| Rule storage | Static TS module (`rules.ts`) | No DB; version-controlled; type-safe; trivially importable |
| Log persistence | In-memory circular buffer | No DB available; sufficient for small-to-medium audience |
| Partially adversarial input | Block entire input | Fail-closed; consistent with FR-007; no fragment surgery |
| Latency budget | None | Correctness over speed (clarification Q1) |
| Log sanitisation | Truncate to 100 chars + PII redaction | Clarification Q2; GDPR-aligned data minimisation |
| Rule lifecycle | Active / Inactive toggle | Clarification Q5; binary simplicity; no staging needed |
| Log retention | 30 days, pruned on append | Clarification Q4; enforced without a scheduler |

---

## Complexity Tracking

No constitution violations. No unusual complexity introduced. The railguard module is a pure-function library with zero external dependencies beyond the TypeScript stdlib.
