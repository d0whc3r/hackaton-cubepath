# Feature Specification: Expand AI Tasks & Settings Redesign

**Feature Branch**: `006-expand-ai-tasks-settings`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "vamos a añadir otras tasks aparte de las que ya tenemos, para cada una de ellas buscaremos un modelo y lo permitiremos configurar en la parte de config — Docstring/comments, Type Hints, Error Explain, Performance Hint, Naming Helper, Dead Code/Cleanup Suggestions"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Error Explanation Task (Priority: P1)

A developer encounters a cryptic error message while coding. They paste the error message alongside the relevant code snippet into the Error Explain task and receive a clear explanation of what went wrong plus concrete steps to fix it — without needing to switch context to a browser or external documentation.

**Why this priority**: This is the highest-frequency, highest-value use case. Developers face errors constantly, and even small language models excel at this. It delivers immediate, standalone value with minimal input.

**Independent Test**: Can be fully tested by submitting any error message + code snippet and verifying the response contains both an explanation of the root cause and numbered fix steps.

**Acceptance Scenarios**:

1. **Given** a user has an error message and a code snippet, **When** they submit both to the Error Explain task, **Then** the system returns an explanation of the root cause and at least one concrete remediation step.
2. **Given** a user submits only an error message without a code snippet, **When** the task processes the input, **Then** the system still returns a meaningful explanation based on the error text alone.
3. **Given** the configured model for Error Explain is available, **When** a request is made, **Then** the response is streamed progressively so the user sees output appearing in real time.

---

### User Story 2 - Docstring / Comments Generation (Priority: P2)

A developer selects a function or snippet and provides a brief description of what the module does. The Docstring task generates or updates documentation comments appropriate for the detected language — covering parameters, return values, and purpose — ready to paste back into the codebase.

**Why this priority**: Documentation debt is universal. This task is easy to scope precisely (input = code + module description → output = documented code) and delivers consistent value across all codebases.

**Independent Test**: Can be fully tested by submitting a function without docstrings and verifying the response adds properly formatted documentation comments without altering the code logic.

**Acceptance Scenarios**:

1. **Given** a user provides a code snippet and a short module description, **When** they run the Docstring task, **Then** the output contains the original code enriched with documentation comments that describe parameters, return values, and purpose.
2. **Given** a function that already has partial docstrings, **When** the user runs the task, **Then** the system updates or completes the existing documentation rather than duplicating it.
3. **Given** the code is in any common programming language, **When** the task runs, **Then** the generated comments follow the documentation style conventional for that language.

---

### User Story 3 - Type Hints / Typing Suggestions (Priority: P2)

A developer pastes a function or module that lacks explicit type annotations. The Type Hints task suggests appropriate types for all parameters and return values, presenting the annotated code — with a strict constraint that no logic or behavior is modified.

**Why this priority**: Typing is a high-value, low-risk task. The strict "no logic changes" constraint makes it safe to apply suggestions directly and provides a clear success criterion.

**Independent Test**: Can be fully tested by submitting an untyped function and confirming the response adds types to all parameters and the return signature without changing any logic, variable names, or structure.

**Acceptance Scenarios**:

1. **Given** a user pastes an untyped function, **When** they run the Type Hints task, **Then** the output shows the same function with type annotations added to parameters and return value.
2. **Given** the code has no logic changes between input and output, **When** a developer reviews the diff, **Then** only type annotation additions are present — no renames, no restructuring, no new logic.
3. **Given** a function that already has some type annotations, **When** the task runs, **Then** only missing annotations are filled in and existing ones are preserved.

---

### User Story 4 - Performance Hint Review (Priority: P3)

A developer submits a code snippet — often a loop, a query, or a hot path — and receives a list of concrete, non-breaking suggestions for improving performance. The task explicitly preserves all existing behavior and only surfaces actionable micro-optimizations.

**Why this priority**: Useful but narrower scope than error resolution or documentation. Requires clear framing ("suggestions only, no rewrites") to be safe and actionable.

**Independent Test**: Can be fully tested by submitting a function with known inefficiencies and verifying the response lists specific suggestions while explicitly noting it does not rewrite the logic.

**Acceptance Scenarios**:

1. **Given** a user submits a code snippet, **When** they run the Performance Hint task, **Then** the response lists specific improvement suggestions without modifying the code.
2. **Given** the submitted code has no obvious performance issues, **When** the task runs, **Then** the system acknowledges the code looks efficient and either suggests minor improvements or confirms none are needed.
3. **Given** the suggestions involve trade-offs, **When** the response is returned, **Then** the trade-off is mentioned so the developer can make an informed choice.

---

### User Story 5 - Naming Helper (Priority: P3)

A developer pastes a block of code with vague or unclear variable and function names. The Naming Helper task returns a structured list of rename suggestions in "before → after" format, along with a brief rationale for each, without rewriting any code.

**Why this priority**: Naming is a perennial pain point. The output format (list of renames) is highly scannable and easy to apply selectively, making it practical even when only a subset of suggestions are accepted.

**Independent Test**: Can be fully tested by submitting code with cryptic names and verifying the response is a list of rename pairs with explanations, not a full code rewrite.

**Acceptance Scenarios**:

1. **Given** a user submits code with unclear variable or function names, **When** they run the Naming Helper task, **Then** the output is a list of rename suggestions in `before → after` format with a short rationale for each.
2. **Given** the code has mixed-quality naming, **When** the task runs, **Then** only genuinely unclear names appear in the suggestion list — well-named identifiers are not flagged.
3. **Given** the user receives the rename list, **When** they apply a subset of suggestions, **Then** the task output is formatted to make selective application easy (one suggestion per line, no merged rewrite).

---

### User Story 6 - Dead Code / Cleanup Suggestions (Priority: P3)

A developer submits a file or code fragment and receives a structured list of cleanup suggestions: unused imports, unreachable code paths, redundant blocks, and dead variables — without any automatic rewriting.

**Why this priority**: Code hygiene matters but is lower urgency than error resolution. The "report only, don't rewrite" contract makes output safe to review before acting.

**Independent Test**: Can be fully tested by submitting a file with known dead imports and verifying the response identifies them specifically by name and location without altering the code.

**Acceptance Scenarios**:

1. **Given** a user submits a file or fragment, **When** they run the Dead Code task, **Then** the response lists specific unused imports, unreachable blocks, or redundant variables — each identified by name or location.
2. **Given** the submitted code has no dead code, **When** the task runs, **Then** the system returns a confirmation that no cleanup issues were found.
3. **Given** the user receives the cleanup list, **When** they review it, **Then** each item includes enough context (name, approximate location) to locate and remove it manually.

---

### User Story 7 - Per-Task Model Selection for New Tasks (Priority: P1)

A user visits the settings page and selects a dedicated AI model for each of the six new tasks — independently from the existing tasks. Each new task has a curated list of recommended models with guidance on trade-offs (speed vs. quality vs. size). The chosen models persist across sessions.

**Why this priority**: Without this, all new tasks would share a default model that may not be optimal. Per-task configuration is the core value proposition of the app and must be available from day one of any new task.

**Independent Test**: Can be fully tested by selecting a non-default model for one new task in settings, saving, and verifying the new task uses that model on the next request.

**Acceptance Scenarios**:

1. **Given** a user opens settings, **When** they navigate to a new task's configuration section, **Then** they see a curated list of recommended models with descriptions of each option.
2. **Given** a user selects a model and saves, **When** they return to settings later, **Then** their selection is still shown as active.
3. **Given** a user changes the model for one task, **When** they navigate to other tasks in settings, **Then** other tasks retain their existing model selections unchanged.

---

### User Story 8 - Redesigned Settings Page for Scale (Priority: P2)

With 10+ configurable tasks (existing + new), a user can navigate the settings page without feeling overwhelmed. Tasks are organized into meaningful groups, and the overall layout scales visually to accommodate the expanded catalog without horizontal scrolling or cramped cards.

**Why this priority**: The current settings layout is designed for 6 sections. Adding 6 more without redesigning will result in a cluttered, unusable interface. A good layout is a prerequisite for users to actually configure the new tasks.

**Independent Test**: Can be fully tested by visiting the settings page with all sections present and verifying all task groups are visible, reachable, and usable without scrolling off-screen.

**Acceptance Scenarios**:

1. **Given** a user opens the settings page, **When** the page loads, **Then** all task sections are reachable without horizontal overflow or layout breakage.
2. **Given** tasks are organized into functional groups, **When** a user scans the page, **Then** they can identify which group a specific task belongs to without reading every card.
3. **Given** the user is on a standard laptop screen, **When** they use the settings page, **Then** no task section is hidden or requires unusual interaction to access.

---

### Edge Cases

- When a user submits an empty required field, an inline validation message is shown below the field and the request is not sent to the model.
- When the configured model for a new task is not installed in Ollama, the task page surfaces the Ollama error inline in the output area — consistent with existing task behavior, no special handling required.
- Non-English error messages in Error Explain are handled through the model's multilingual capability; no special app-level logic is required.
- When input exceeds the model's context window, Ollama returns an error which is surfaced inline — consistent with existing task behavior; no special handling required.
- Naming Helper on minified or obfuscated code is a known limitation; the model may return few or no suggestions, which is an acceptable degraded response.
- Dead Code detection on a fragment without full import context is a known limitation; the model will report what it can detect, which may be incomplete — acceptable for the current scope.

---

## Requirements *(mandatory)*

### Functional Requirements

**New Tasks**

- **FR-000**: All new task pages MUST validate required input fields on submission: if a required field is empty, an inline validation message MUST appear below the field and the request MUST NOT be sent to the model.
- **FR-001**: The system MUST provide a Docstring/Comments task that accepts a code snippet plus an optional module description, and returns the code enriched with documentation comments.
- **FR-002**: The Docstring task MUST preserve all original logic, structure, and variable names — only documentation comments may be added or updated.
- **FR-003**: The system MUST provide a Type Hints task that accepts untyped or partially typed code and returns the same code with type annotations added.
- **FR-004**: The Type Hints task MUST NOT alter logic, rename identifiers, or restructure code — only type annotations may be added.
- **FR-005**: The system MUST provide an Error Explain task that accepts an error message and an optional code snippet, and returns a root-cause explanation plus remediation steps.
- **FR-006**: The Error Explain task MUST produce useful output even when no code snippet is provided — based on the error message alone.
- **FR-007**: The system MUST provide a Performance Hint task that accepts a code snippet and returns a list of non-breaking optimization suggestions.
- **FR-008**: The Performance Hint task MUST clearly communicate that suggestions are advisory and that the original code logic must not change.
- **FR-009**: The system MUST provide a Naming Helper task that accepts a code snippet and returns a structured list of rename suggestions in "before → after" format with rationale.
- **FR-010**: The Naming Helper task MUST NOT return a rewritten version of the code — only the rename list.
- **FR-011**: The system MUST provide a Dead Code / Cleanup task that accepts a file or code fragment and returns a list of identified issues (unused imports, dead code blocks, redundant variables).
- **FR-012**: The Dead Code task MUST NOT modify or rewrite the submitted code — it MUST only report findings.

**Model Configuration**

- **FR-013**: Each of the six new tasks MUST have an independently configurable AI model in the settings page.
- **FR-014**: Each new task's model selection MUST include a curated list of recommended models with display names, parameter counts, and brief descriptions.
- **FR-015**: Model selections for new tasks MUST persist across browser sessions.
- **FR-016**: The system MUST apply the user-configured model when executing a new task, falling back to the task's default model if no selection has been saved.

**Settings Page Redesign**

- **FR-017**: The settings page MUST organize all task configuration sections into four named tab groups: **Infrastructure** (analyst), **Analysis** (explain, error-explain, performance-hint, dead-code, naming-helper), **Generation** (test, refactor, docstring, type-hints, commit), and **Language** (translate).
- **FR-018**: The settings page MUST display all task sections without horizontal overflow on screens 1280px wide or wider.
- **FR-019**: The settings page MUST allow a user to reach any task's configuration section within two navigation actions from the page entry point: (1) click the relevant tab group, (2) select the task section within that tab.
- **FR-020**: The settings tab layout MUST accommodate adding future task sections to an existing tab group without requiring structural changes to the tab navigation itself.

### Key Entities

- **Task**: A named AI-assisted code operation with a defined input schema, output contract, and an assigned AI model. New tasks: `docstring`, `type-hints`, `error-explain`, `performance-hint`, `naming-helper`, `dead-code`.
- **TaskGroup**: A logical grouping of tasks displayed together in the settings page (e.g., "Analysis", "Generation", "Infrastructure").
- **ModelSelection**: The user's persisted choice of AI model for a given task, stored locally in the browser.
- **ModelOption**: A selectable AI model for a task, described by display name, parameter count, approximate disk size, context window, and a brief use-case description.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All six new tasks are accessible from the main navigation and return meaningful output for valid inputs — each task returns a non-empty, relevant response for standard test inputs.
- **SC-002**: Users can select a model for each new task and confirm the selection persists after a page reload — verifiable for all six new tasks independently.
- **SC-003**: The redesigned settings page displays all task sections without layout breakage on screens 1280px wide or wider.
- **SC-004**: The Error Explain and Naming Helper tasks return structured, scannable output — verified by responses containing distinct sections (explanation + steps; before/after list) in ≥90% of well-formed inputs.
- **SC-005**: The Type Hints and Docstring tasks return output that differs from input only in the addition of annotations or comments — no logic changes detectable in a diff for well-formed inputs.
- **SC-006**: Navigation from the home page or sidebar to any new task page requires no more than one click.
- **SC-007**: The home page displays all tasks organized into Analysis and Generation groups, matching the settings tab structure, so users share the same mental model across both surfaces.

---

## Clarifications

### Session 2026-03-22

- Q: What navigation pattern should the redesigned settings page use for 12+ task sections? → A: Tabbed navigation — extend current tab system with functional group tabs (Infrastructure / Analysis / Generation / Language).
- Q: Which tab group should each new task belong to? → A: Analysis tab: explain, error-explain, performance-hint, dead-code, naming-helper. Generation tab: test, refactor, docstring, type-hints, commit. Infrastructure: analyst. Language: translate.
- Q: How should the home page catalog present all tasks with 10+ entries? → A: Grouped by category matching the settings tabs — Analysis group and Generation group of cards, consistent mental model across home and settings.
- Q: How should task pages handle empty required fields on submission? → A: Show an inline validation message below the empty field — prevent submission until the field is filled, no model round-trip wasted.
- Q: What should the task page show when the configured model is not installed in Ollama? → A: Same behavior as existing tasks — surface whatever error Ollama returns as an inline error in the output area, no special detection or UI per task.

---

## Assumptions

- The six new tasks follow the same streaming response pattern as existing tasks (explain, test, refactor, commit).
- Each new task will have its own dedicated page following the existing routing convention.
- The analyst/router model is not needed for the new tasks — they route directly to their configured specialist model, since the user explicitly selects the task from the UI.
- Recommended model lists for new tasks will be curated from models already available in the system, plus targeted additions for tasks that benefit from specialized models (e.g., error-explain works well with small, fast models).
- The settings page redesign uses tabbed navigation with four functional tabs (Infrastructure / Analysis / Generation / Language), rather than extending the current horizontal card strip indefinitely.
- Performance Hint and Dead Code tasks only require the code snippet as input (no additional description field), unlike Docstring which benefits from a module description.
- The home page task overview cards will be reorganized into two groups — **Analysis** and **Generation** — matching the settings tab structure, so users share one consistent mental model across both surfaces.
