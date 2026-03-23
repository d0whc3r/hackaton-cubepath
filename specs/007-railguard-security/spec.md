# Feature Specification: Railguard Security Protection

**Feature Branch**: `007-railguard-security`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "Implementar y reforzar mecanismos de protección frente a railguard failures, jailbreaks y bypasses, asegurando que el sistema mantenga sus restricciones de seguridad incluso ante entradas maliciosas o intentos de evasión."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adversarial Input Is Blocked (Priority: P1)

A developer or end user attempts to submit a prompt designed to bypass the AI system's safety constraints — for example, by using role-play framing, encoding tricks, or instruction injection. The system detects the attempt and refuses to process the input, returning a clear, safe response instead of complying with the malicious request.

**Why this priority**: This is the core safety guarantee. Without it, all downstream functionality is at risk of misuse. Every other story depends on the baseline blocking capability being reliable.

**Independent Test**: Can be fully tested by submitting a set of known adversarial prompts and verifying the system rejects or neutralises them, delivering the value of a hardened AI interface.

**Acceptance Scenarios**:

1. **Given** a user submits a prompt that uses role-play framing to override safety instructions, **When** the system evaluates the input, **Then** the input is blocked and a safe rejection message is returned without executing the requested action.
2. **Given** a user submits a prompt containing encoded or obfuscated instructions intended to bypass filters, **When** the system evaluates the input, **Then** the obfuscation is detected and the input is rejected before any content is generated.
3. **Given** a prompt attempts to inject new system-level instructions, **When** the system processes the input, **Then** the injected instructions are ignored and the original system behaviour is preserved.

---

### User Story 2 - Legitimate Input Is Never Blocked (Priority: P2)

A regular user submits a valid, benign prompt to the AI system. The safety mechanisms correctly identify the input as safe and allow normal processing to continue without interruption or false positives.

**Why this priority**: Railguards only have value if they do not degrade legitimate use. High false-positive rates destroy user trust and product utility. This story protects the product experience.

**Independent Test**: Can be fully tested by submitting a representative set of legitimate prompts and verifying none are incorrectly blocked, delivering the value of a usable, trustworthy AI interface.

**Acceptance Scenarios**:

1. **Given** a user submits a standard task-oriented prompt (e.g., asking for a code review or a summary), **When** the system evaluates the input, **Then** the request is processed normally without triggering any safety rejection.
2. **Given** a prompt contains words that appear in adversarial patterns but only in clearly benign syntactic positions (e.g., "can you explain how jailbreaks work?" or "how do I write instructions for a README?"), **When** the system evaluates the input, **Then** the system does not block the request — the patterns in active rules are specific enough to avoid matching normal developer language.

---

### User Story 3 - Security Events Are Logged and Measurable (Priority: P3)

A developer or security reviewer inspects the system's security logs to understand how many adversarial attempts were made, which vectors were used, and what the block rate is. This enables ongoing security monitoring and iterative improvement of the railguard rules.

**Why this priority**: Measurement is required to validate the effectiveness of protections and to justify future investment. Without logs, the system cannot be audited or improved.

**Independent Test**: Can be fully tested by triggering a set of known adversarial inputs and verifying that each event is recorded with sufficient detail (timestamp, input category, decision, reason), delivering the value of an auditable safety system.

**Acceptance Scenarios**:

1. **Given** a blocked adversarial input event occurs, **When** the security log is inspected, **Then** the log entry includes at minimum: timestamp, attack vector category, sanitised input excerpt, and the block reason.
2. **Given** a review period has passed, **When** a developer queries the security metrics, **Then** they can obtain a block rate (blocked / total evaluated) for any given time window.

---

### User Story 4 - Security Rules Are Documented and Maintainable (Priority: P4)

A developer joins the project and needs to understand which railguard rules are in place, what each rule protects against, and how to add or modify rules without breaking existing protections.

**Why this priority**: Rules that cannot be understood or maintained will decay. Documentation ensures the system can be evolved safely by new contributors.

**Independent Test**: Can be fully tested by asking a developer unfamiliar with the codebase to locate, read, and extend a railguard rule using only the documentation, delivering the value of a maintainable security layer.

**Acceptance Scenarios**:

1. **Given** a new attack vector is identified, **When** a developer follows the documented process, **Then** a new rule can be added and validated without modifying unrelated system components.
2. **Given** an existing rule needs updating, **When** a developer reads the rule documentation, **Then** they understand the attack vector it covers, the expected behaviour, and the test case that validates it.

---

### Edge Cases

- When a prompt is partially adversarial (legitimate request mixed with injection attempt), the entire input is blocked and a safe rejection message is returned — no fragment surgery or partial processing occurs.
- How does the system handle very long inputs that attempt to overwhelm or confuse the validator?
- When a previously unknown jailbreak technique is submitted (zero-day bypass): the input passes through unblocked, since the railguard can only detect patterns it has been taught. Coverage of new attack vectors is addressed through the rule addition process documented in quickstart.md and periodic rule set reviews.
- How does the system behave when the validation component itself encounters an error — does it fail open or fail closed?
- When a legitimate user inadvertently triggers a false positive repeatedly: the system returns the same safe rejection message on each attempt. No rate limiting, account flagging, or escalation mechanism is in scope for this feature. The correct resolution is for the user to rephrase their input. Reducing false positives through accurate rule patterns (US2) is the primary mitigation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST validate all user inputs against a defined set of railguard rules before passing them to the AI model.
- **FR-002**: The system MUST block inputs that match known adversarial patterns, including but not limited to: role-play override attempts, instruction injection, encoding-based obfuscation, and persona-switching prompts.
- **FR-003**: The system MUST return a safe, non-compliant response to the user when an input is blocked, without revealing the specific rule that was triggered.
- **FR-004**: The system MUST preserve normal behaviour for all inputs that do not match adversarial patterns, ensuring no degradation of legitimate use.
- **FR-005**: The system MUST log every input evaluation — both blocked and allowed — as a ValidationEvent. Each event MUST include: decision (blocked/allowed), timestamp, and sanitised input excerpt (truncated to first 100 characters; recognised PII patterns such as email addresses and phone numbers replaced with "[REDACTED]"). Blocked events MUST additionally include: attack vector category, matched rule ID, and block reason.
- **FR-006**: The system MUST expose a measurable block rate metric over configurable time windows.
- **FR-007**: The system MUST fail closed when the validation component encounters an error — defaulting to blocking the input rather than allowing it through.
- **FR-008**: The railguard rules MUST be defined in a single, documented, maintainable configuration that can be extended without modifying core system logic.
- **FR-009**: The system MUST include an adversarial test suite covering all documented attack vector categories, with each test case labelled by vector type.
- **FR-010**: The adversarial test suite MUST achieve a minimum block rate of 90% across all known attack vector categories.
- **FR-011**: When any adversarial pattern is detected within an input — regardless of whether the rest of the input is benign — the entire input MUST be blocked. Partial processing or fragment redaction is not permitted.
- **FR-012**: The system MUST automatically purge ValidationEvent log entries older than 30 days.
- **FR-013**: Each RailguardRule MUST have a binary status (Active / Inactive). Only Active rules are applied during input validation. Inactive rules are retained in the configuration but not evaluated.

### Key Entities

- **RailguardRule**: A named, versioned definition of a prohibited input pattern. Includes: name, category, description, pattern definition, status (Active / Inactive), expected behaviour, and linked test case(s). Only Active rules are evaluated at validation time.
- **ValidationEvent**: A record of a single input evaluation. Includes: timestamp, sanitised input excerpt (first 100 chars, PII redacted), matched rule (if any), decision (blocked / allowed), and block reason. Retained for 30 days, then purged.
- **AttackVectorCategory**: A classification of adversarial technique types (e.g., role-play override, instruction injection, encoding bypass, persona switch, prompt flooding). Used for grouping rules and reporting.
- **SecurityMetrics**: Aggregated statistics over a time window. Includes: total evaluations, blocked count, allowed count, block rate, and breakdown by attack vector category.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of inputs from the adversarial test suite (covering all defined attack vector categories) are correctly blocked.
- **SC-002**: Zero legitimate inputs from a representative benign test suite are incorrectly blocked (0% false positive rate on the defined test set).
- **SC-003**: Every blocked event produces a retrievable log entry within 5 seconds of the event occurring.
- **SC-004**: A developer unfamiliar with the codebase can add a new railguard rule and a corresponding test case within 30 minutes, using only the project documentation.
- **SC-005**: Security metrics (block rate and category breakdown) can be obtained for any 24-hour window without manual data extraction.
- **SC-006**: All documented attack vector categories have at least 3 test cases each in the adversarial test suite.

## Clarifications

### Session 2026-03-23

- Q: What is the maximum acceptable latency that railguard validation may add per request? → A: No strict limit — correctness takes priority over speed.
- Q: What does "sanitised input excerpt" mean in a blocked-event log entry? → A: Truncate to first 100 characters and redact recognised PII patterns (email, phone, etc.).
- Q: How should the system respond when a prompt contains both a legitimate request and an embedded adversarial fragment? → A: Block the entire input and return a safe rejection message.
- Q: How long should ValidationEvent log entries be retained before being purged? → A: 30 days.
- Q: What lifecycle states should a RailguardRule support? → A: Active / Inactive binary toggle.

## Assumptions

- The system already has an AI model integration layer through which all user inputs pass; railguards will be implemented as a pre-processing step at that layer.
- "Railguard failure" in scope refers to the validation layer allowing adversarial content through — not to model hallucination or post-generation errors.
- The adversarial test suite will be maintained as part of the codebase and run as part of the standard CI/CD pipeline.
- The system serves a small-to-medium developer audience; logging volume is not expected to require a dedicated log aggregation platform at this stage.
- Validation latency has no strict upper bound; detection correctness (block rate and false positive rate) takes priority over speed.
- Rules are based on text pattern matching supplemented by semantic heuristics; hardware-accelerated inference is not assumed.
- The initial scope covers prompt-level protections only; model fine-tuning or reinforcement-based mitigations are out of scope for this feature.
