# Research: Railguard Security Protection

**Branch**: `007-railguard-security` | **Date**: 2026-03-23

---

## 1. Integration Point

**Decision**: Insert the railguard as a synchronous pre-processing step inside the `POST` handler in `src/pages/api/route.ts`, immediately after Zod schema validation (`RouteRequestSchema.safeParse`) and before any routing or model invocation.

**Rationale**: This is the single server-side chokepoint through which every user input must pass. Placing the guard here means it applies uniformly to all 10 task types (both direct and analyst-routed paths) without duplicating logic across the routing tree. The guard runs before `resolveModel()` so a blocked request never touches the AI layer.

**Alternatives considered**:
- Client-side (`use-chat-input.ts`): Rejected — client-side guards are trivially bypassed; only a server-side check is authoritative.
- Inside each specialist / prompt builder: Rejected — would require duplicating guard logic across 10+ code paths; high maintenance burden and easy to miss new paths.
- Middleware layer (Astro middleware): Considered but rejected for this iteration — Astro middleware runs on all routes; the guard is specific to `/api/route` and benefits from access to the already-parsed request body.

---

## 2. Rule Storage Format

**Decision**: Static TypeScript module at `src/lib/railguard/rules.ts` exporting a typed `RAILGUARD_RULES` array. Each rule is a plain object (`RailguardRule`) with fields: `id`, `name`, `category`, `status`, `patterns` (array of `RegExp`), and `description`.

**Rationale**: No database exists in this project (storage is browser `localStorage` for config only). A static TS module is co-located with the source, version-controlled, immediately type-checked, and trivially importable on the server side. For the audience size specified (small-to-medium), runtime rule reloading is not a requirement.

**Alternatives considered**:
- JSON config file: Rejected — RegExp patterns cannot be serialised to JSON natively; would require a compile step or `eval`, adding complexity.
- Environment variable flags: Rejected — not expressive enough for pattern-based rules.
- External rules service: Rejected — adds a network dependency and deployment complexity unjustified at this scale.

---

## 3. Logging / ValidationEvent Persistence

**Decision**: In-memory circular buffer (max 1,000 entries) implemented as a module-level singleton in `src/lib/railguard/event-log.ts`. Events are appended on each validation call. A `pruneOlderThan(days: number)` utility purges entries older than 30 days on each append. Metrics are computed on-demand by iterating the buffer.

**Rationale**: The project has no server-side persistence layer. The spec explicitly states logging volume does not require a dedicated aggregation platform. An in-memory store is sufficient for the stated use case (developer audit review within a session or short-lived server instance). The 30-day retention is enforced on append so the buffer never grows unbounded between server restarts.

**Alternatives considered**:
- File-based log (append to `.jsonl`): Considered — adds 30-day persistence across server restarts but introduces file I/O and a write-path failure mode. Deferred to a future iteration.
- `localStorage` (browser): Not applicable — guard runs server-side.
- External logging service: Rejected — out of scope per spec assumptions.

---

## 4. Attack Vector Categories & Initial Rule Set

**Decision**: Five categories covering the most common LLM jailbreak techniques documented in academic literature and red-team practice:

| Category ID | Name | Example Patterns |
|-------------|------|-----------------|
| `role-play-override` | Role-play Override | "pretend you are", "act as if you have no restrictions", "you are now DAN" |
| `instruction-injection` | Instruction Injection | "ignore previous instructions", "disregard your system prompt", "new instructions:" |
| `encoding-bypass` | Encoding Bypass | base64-encoded instruction blocks, ROT13 obfuscation, leetspeak command sequences |
| `persona-switch` | Persona Switch | "your true self", "jailbreak mode", "developer mode enabled" |
| `prompt-flooding` | Prompt Flooding | Inputs constructed to exceed semantic coherence via extreme repetition or whitespace padding designed to dilute the system prompt context window |

**Rationale**: These five categories map directly to the spec's `AttackVectorCategory` entity and cover the canonical vectors identified in published LLM security research (OWASP LLM Top 10, PromptInject, Greshake et al. 2023). The initial pattern set should be treated as a starting point — new rules are expected to be added over time via the documented extension process.

**Alternatives considered**:
- ML-based semantic classifier: Considered — higher recall but requires a secondary model call, adds latency, and contradicts the spec's "correctness over speed, no dedicated infrastructure" stance. Deferred.
- Blocklist of exact strings: Rejected — too brittle; adversaries trivially substitute characters.

---

## 5. Sanitisation Implementation

**Decision**: The `sanitise(input: string)` utility in `src/lib/railguard/sanitise.ts` applies two transformations before storing an excerpt in a `ValidationEvent`:
1. Truncate to first 100 characters.
2. Replace matches of recognised PII patterns (RFC 5322 email, E.164 phone) with `[REDACTED]`.

**Rationale**: Directly specified in clarification Q2. Regex-based PII detection is deterministic, zero-dependency, and sufficient for the threat model (protecting against accidentally logging user credentials embedded in prompts).

---

## 6. Partially Adversarial Input Handling

**Decision**: Block the entire input. No fragment surgery. (Specified in clarification Q3.)

**Implementation note**: The `validateInput()` function returns on the first matched rule. This means the first adversarial fragment found causes an immediate `blocked` result for the whole input — consistent with fail-closed behaviour (FR-007).

---

## 7. Testing Strategy

**Decision**: Adversarial test suite co-located with the railguard module at `src/__tests__/lib/railguard/`. Each test file covers one attack vector category. Tests use the same Vitest + happy-dom setup as the rest of the project. MSW is not required (the railguard is a pure function with no HTTP calls).

**Rationale**: Pure functions are the easiest unit of security testing. No mocking needed. Tests import `validateInput()` directly and assert on the `ValidationResult` shape.

**Minimum coverage target**: ≥3 adversarial test cases per category (SC-006), plus a benign suite asserting 0% false positives on a representative set of legitimate developer inputs.
