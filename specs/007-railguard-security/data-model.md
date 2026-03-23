# Data Model: Railguard Security Protection

**Branch**: `007-railguard-security` | **Date**: 2026-03-23

---

## Entities

### RailguardRule

A named, versioned definition of a prohibited input pattern. Only `Active` rules are evaluated at validation time.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `string` | Unique, kebab-case, immutable once published |
| `name` | `string` | Human-readable display name |
| `category` | `AttackVectorCategory` | One of the five defined categories |
| `status` | `"active" \| "inactive"` | Binary toggle; only active rules run |
| `patterns` | `RegExp[]` | One or more patterns; match is OR (any match = blocked) |
| `description` | `string` | Plain-language explanation of the attack vector |
| `version` | `number` | Increment on pattern changes; starts at 1 |

**Validation rules**:
- `id` must be unique across all rules in `RAILGUARD_RULES`.
- `patterns` must be non-empty.
- Rules with `status: "inactive"` are skipped entirely during validation — they do not contribute to metrics.

---

### ValidationEvent

A record of a single input evaluation. Retained for 30 days, then purged automatically.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `string` | UUID v4, generated at creation |
| `timestamp` | `Date` | UTC, set at validation time |
| `decision` | `"blocked" \| "allowed"` | Outcome of the validation |
| `matchedRuleId` | `string \| null` | ID of the first matched rule, or `null` if allowed |
| `attackVectorCategory` | `AttackVectorCategory \| null` | Category of the matched rule, or `null` if allowed |
| `sanitisedExcerpt` | `string` | First 100 chars of original input with PII redacted |
| `blockReason` | `string \| null` | Human-readable reason derived from the matched rule, or `null` if allowed |

**Validation rules**:
- If `decision` is `"blocked"`, `matchedRuleId`, `attackVectorCategory`, and `blockReason` must all be non-null.
- If `decision` is `"allowed"`, `matchedRuleId`, `attackVectorCategory`, and `blockReason` must all be `null`.
- `sanitisedExcerpt` is always populated (even for allowed events) to enable post-hoc review.

---

### AttackVectorCategory

An enumeration of the five recognised adversarial technique categories.

| Value | Display Name | Description |
|-------|-------------|-------------|
| `role-play-override` | Role-play Override | Prompts framing the model as a different, unrestricted persona |
| `instruction-injection` | Instruction Injection | Inputs embedding directives to ignore or overwrite the system prompt |
| `encoding-bypass` | Encoding Bypass | Instructions hidden via base64, ROT13, leetspeak, or other encoding |
| `persona-switch` | Persona Switch | Attempts to activate an alternate model "mode" with relaxed constraints |
| `prompt-flooding` | Prompt Flooding | Extreme-length or high-repetition inputs designed to dilute system prompt context |

---

### SecurityMetrics

An aggregated view computed on-demand from the `ValidationEvent` log for a given time window.

| Field | Type | Description |
|-------|------|-------------|
| `windowStart` | `Date` | Start of the query window |
| `windowEnd` | `Date` | End of the query window |
| `totalEvaluations` | `number` | All events (blocked + allowed) in the window |
| `blockedCount` | `number` | Events with `decision: "blocked"` |
| `allowedCount` | `number` | Events with `decision: "allowed"` |
| `blockRate` | `number` | `blockedCount / totalEvaluations` (0–1); `null` if no evaluations |
| `byCategory` | `Record<AttackVectorCategory, number>` | Blocked event count per category |

---

### ValidationResult (internal, not persisted)

The immediate return value of `validateInput()`. Used by the API route handler to decide how to respond.

| Field | Type | Description |
|-------|------|-------------|
| `decision` | `"blocked" \| "allowed"` | Outcome |
| `matchedRuleId` | `string \| null` | First matched rule ID |
| `attackVectorCategory` | `AttackVectorCategory \| null` | Category of matched rule |
| `blockReason` | `string \| null` | Human-readable block reason |

---

## State Transitions

### RailguardRule status

```
[active] ←→ [inactive]
```

Rules can be toggled between active and inactive at any time by editing `src/lib/railguard/rules.ts`. No migration is required; the change takes effect on the next server restart.

### ValidationEvent lifecycle

```
[created] → [retained] → [purged after 30 days]
```

Events are append-only. Purging is triggered automatically on each append to the event log. Events are never updated after creation.

---

## Module Layout

```
src/lib/railguard/
├── rules.ts          # RAILGUARD_RULES: RailguardRule[] (the rule registry)
├── validator.ts      # validateInput(input): ValidationResult
├── sanitise.ts       # sanitise(input): string  (truncate + PII redact)
├── event-log.ts      # in-memory circular buffer, appendEvent(), pruneOlderThan(), getMetrics()
└── index.ts          # public re-exports
```
