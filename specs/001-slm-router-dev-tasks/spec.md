# Feature Specification: Intelligent SLM Router for Developer Tasks

**Feature Branch**: `001-slm-router-dev-tasks`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "Router inteligente de SLMs para tareas del dev"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explain Code (Priority: P1)

A developer pastes a code snippet into the web interface and selects "Explain". The system automatically detects the programming language, then animates a routing panel showing the decision process in real-time before returning a clear, natural-language explanation of what the code does.

**Why this priority**: Code explanation is the most universal developer task and the most visible demonstration of the intelligent routing value. It is the simplest flow to test end-to-end and serves as the entry point for first-time users.

**Independent Test**: Can be tested by pasting any code snippet, selecting "Explain", and verifying both the animated routing panel and a coherent plain-language response appear. Delivers standalone value as a code comprehension aid.

**Acceptance Scenarios**:

1. **Given** a developer has pasted a code snippet, **When** they select "Explain" and submit, **Then** the system returns a clear natural-language explanation within 10 seconds.
2. **Given** the system receives an explain request, **When** routing occurs, **Then** an animated panel displays the routing steps in sequence (e.g., "detecting language → analyzing task → selecting specialist → requesting response") before the result appears.
3. **Given** the specialist returns a response, **When** the response finishes streaming, **Then** the explanation is readable and contextually relevant to the submitted code, and a cost comparison badge appears showing the estimated cost of this request versus the equivalent large-model request.

---

### User Story 2 - Generate Tests (Priority: P2)

A developer submits a function or module and selects "Generate Tests". The system routes to a test-generation specialist and returns a set of test cases covering the main behaviors of the submitted code.

**Why this priority**: Test generation has immediate practical value and demonstrates that a focused small model can match the output quality of a large model for a well-defined task.

**Independent Test**: Can be tested by submitting a simple function and verifying that the returned test cases cover at least the happy path and one edge case.

**Acceptance Scenarios**:

1. **Given** a developer submits code and selects "Generate Tests", **When** the system processes the request, **Then** test cases are returned that cover the primary function behaviors.
2. **Given** the test request is routed, **When** the specialist responds, **Then** the generated tests are formatted consistently and ready to copy into a project.
3. **Given** an edge case is present in the code, **When** tests are generated, **Then** at least one test addresses boundary or error conditions.

---

### User Story 3 - Refactor Code (Priority: P3)

A developer submits a code snippet and selects "Refactor". The system routes to a code-specialist model and returns an improved version of the code with a brief explanation of the changes made.

**Why this priority**: Refactoring demonstrates the system's ability to transform code, not just describe it, showcasing a distinct specialist capability versus explanation.

**Independent Test**: Can be tested by submitting a known code smell (e.g., deeply nested conditionals) and verifying the returned code is functionally equivalent but structurally improved.

**Acceptance Scenarios**:

1. **Given** a developer submits code and selects "Refactor", **When** the system responds, **Then** the refactored code and a short summary of changes are returned.
2. **Given** the refactored code is returned, **When** the developer reviews it, **Then** the code is functionally equivalent to the original and at least one improvement is evident.
3. **Given** no meaningful refactoring is possible, **When** the specialist processes the request, **Then** the system informs the user that the code is already well-structured.

---

### User Story 4 - Write Commit Message (Priority: P4)

A developer pastes a code diff or a free-text description of their changes into a single input area and selects "Write Commit". The system routes the request to the appropriate specialist, which handles both diff and natural-language input formats, and returns a short, plain commit message (2 lines maximum, no conventional commit format).

**Why this priority**: Commit message generation is a high-frequency, low-effort task where routing quality is highly measurable and the output format is well-defined.

**Independent Test**: Can be tested by providing a simple diff and verifying the returned message is at most 2 lines, does not use conventional commit format, and accurately reflects the change.

**Acceptance Scenarios**:

1. **Given** a developer pastes a diff or free-text description and selects "Write Commit", **When** the system responds, **Then** a plain-text commit message is returned in at most 2 lines (e.g., line 1: "correct null check in user validator", line 2: optional brief description).
2. **Given** the specialist receives the input, **When** it is a raw diff, **Then** the generated message reflects the actual code changes; when it is a text description, the message reflects the described intent.
3. **Given** the diff describes multiple logical changes, **When** the message is generated, **Then** the specialist returns a combined 2-line message and adds a brief suggestion to split the changes into separate commits.

---

### Edge Cases

- What happens when the user submits an empty input or only whitespace?
- How does the system handle input that is not code (e.g., natural language text submitted to "Refactor")?
- What if the specialized model is unavailable or returns an error?
- How does the system behave when the submitted code is in an unusual or mixed language?
- What happens when the input is very large (e.g., hundreds of lines of code)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to submit a code snippet or text input via a web interface.
- **FR-002**: System MUST present four task options to the user: Explain, Generate Tests, Refactor, Write Commit.
- **FR-003**: System MUST automatically detect the programming language of the submitted code before routing, and pass that language context to the specialist.
- **FR-004**: System MUST route each request using both the selected task type and the content of the input as signals (content-aware routing), without requiring the user to choose a model.
- **FR-005**: System MUST display an animated routing panel for every request, showing the decision steps in sequence (language detection → content analysis → specialist selection → response) in real-time as they occur.
- **FR-006**: System MUST return the specialist's response to the user within the same interface session.
- **FR-007**: System MUST display a live cost comparison alongside every response, showing the estimated cost of the completed request versus the equivalent cost using a large general-purpose model.
- **FR-008**: System MUST handle routing errors gracefully and inform the user if a response cannot be generated.
- **FR-009**: System MUST reject input exceeding 8000 characters and display a short guide on how to partition the input manually.
- **FR-010**: System MUST accept free-form text input for the Write Commit task (both raw diffs and natural-language change descriptions), without requiring the user to select an input format.
- **FR-011**: All specialist output MUST be plain text only — no markdown syntax, no markdown code blocks, no markdown tables; output must be directly copyable without formatting artifacts.
- **FR-012**: Explain specialist output MUST follow this fixed structure in order: "What it does", "Why it works", "Example", "Risks". Depth adapts to input complexity.
- **FR-013**: Generate Tests specialist output MUST include two sections: (1) executable tests using the mainstream framework for the detected language (Vitest for TS/JS, pytest for Python, testing package for Go, JUnit for Java, built-in test framework for Rust); (2) pseudocode for additional edge/error cases. If the language is not detected with sufficient confidence, output pseudocode only.
- **FR-014**: Refactor specialist output MUST end with the explicit line: "Behavior preserved: yes|no - <short note>". Legibility takes priority over performance.
- **FR-015**: Commit specialist output MUST be at most 2 lines: line 1 is a short title, line 2 is an optional brief description. Must NOT use conventional commit format. If the input describes multiple logical changes, line 2 MUST include a brief split suggestion.
- **FR-016**: System MUST enforce a single active request at a time; the submit button is disabled while a request is in progress.
- **FR-017**: System MUST allow the user to cancel an active request; any partial output received before cancellation MUST be preserved and displayed.
- **FR-018**: System MUST maintain a session history of up to 50 interactions in memory; the default view shows the 10 most recent items with a "Load more" control to display earlier items.
- **FR-019**: System MUST allow the user to edit and resend any previous input from the session history.
- **FR-020**: The copy action available in the interface MUST copy only the specialist response, not the user input.

### Key Entities

- **Request**: A user submission containing a code snippet or text, a selected task type, and a timestamp.
- **Task Type**: One of four categories (Explain, Generate Tests, Refactor, Write Commit) that determines routing logic.
- **Routing Decision**: The mapping between a task type and the specialist selected to handle it, recorded per request.
- **Specialist**: A configured model optimized for a specific task category (natural-language explanation, test generation, or code transformation).
- **Response**: The output returned by the specialist, associated with the original request.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users receive a response to any submitted task within 10 seconds (p95) under single-user demo conditions.
- **SC-002**: The system achieves routing contract accuracy of at least 95% across a minimum of 50 manual test requests. Routing is considered correct when all three conditions hold simultaneously: (1) the task type maps to the correct specialist, (2) the commit input mode (diff vs. prose) is correctly identified when applicable, and (3) the detected language is reasonable for the input.
- **SC-003**: At least 80% of responses are judged useful by manual review using a per-task rubric (each case scored on 5 criteria; a case passes with ≥ 4/5).
- **SC-004**: Technical error rate (specialist call failures, timeouts, or stream interruptions) is at most 8% of all requests.
- **SC-005**: The live cost counter accurately reflects a per-request cost that is at least 50% lower than the large-model equivalent, verifiable by inspecting the cost figures shown in the UI across 10 sample requests.
- **SC-006**: A first-time user can submit their first task and receive a response without reading any documentation, within 2 minutes of arriving on the app.
- **SC-007**: A first-time observer can correctly understand the routing concept by watching the animated routing panel across 3 live demo requests, within 30 seconds.

## Assumptions

- The application is a demonstration/educational tool, not a production system requiring enterprise-grade availability or compliance.
- Target users are senior developers; all interface text and output is in English only (v1).
- No user authentication is required; the app is accessible openly (suitable for a hackathon demo).
- The four task types (Explain, Generate Tests, Refactor, Write Commit) cover the full scope of v1; no additional task types are in scope.
- The routing uses both task type and input content as signals; task type provides the primary route while content analysis (including language detection) refines prompt construction.
- Language detection operates on the submitted code text automatically; the user is never asked to specify the language manually.
- Priority languages for detection and test framework mapping: JavaScript/TypeScript, Python, Go, Java, Rust.
- The Write Commit task accepts both raw git diffs and free-text change descriptions through a single unified input area; no mode switching is required.
- The commit specialist infers from the input content whether it is a diff or a prose description.
- The live cost comparison uses estimated costs based on token counts (chars ÷ 4) and representative model pricing; it is clearly labelled as an estimate.
- Performance targets assume a single user at a time or very low concurrent usage appropriate for a demo context.
- No automatic retries; if a request fails or the stream is interrupted, the user initiates a manual retry.
- No content is persisted beyond the current session; no input or output is logged.
