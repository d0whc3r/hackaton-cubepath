# Feature Specification: Migrate All Fetch Calls to Wretch

**Feature Branch**: `005-migrate-fetch-wretch`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "vamos a modificar todos los fetch para usar la lib de wretch, busca info de como hacerlo en internet"

## Clarifications

### Session 2026-03-22

- Q: How should streaming responses (Ollama pull/model endpoints) be handled with wretch? → A: Use wretch with `.res()` terminal method to obtain the raw `Response` object and stream manually — all benefits of the shared client (config, non-OK error handling) still apply.
- Q: Should retry and/or deduplication middleware be included in this migration? → A: Add both `retry()` and `dedupe()` middleware globally on the shared client.
- Q: Should there be one shared client or separate clients for server-side and client-side code? → A: Two separate shared clients — one for server-side API routes (calling Ollama directly), one for client-side components/hooks (calling the app's own API).
- Q: How should tests mock HTTP requests after the wretch migration? → A: Use MSW (Mock Service Worker) to intercept at the network level — replaces any existing fetch mocks with handler-based interception that works regardless of the HTTP client used.
- Q: What retry behavior should the global retry middleware use? → A: Retry on network errors and 5xx responses only, max 3 attempts, exponential backoff. 4xx errors must not be retried.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Centralized HTTP Client Configuration (Priority: P1)

A developer working on the codebase wants all outbound HTTP requests to share a single, consistently configured client so that base URL, default headers, and global error handling only need to be defined once instead of duplicated across every call site.

**Why this priority**: Today there are 8 files making raw fetch calls. Any cross-cutting concern (authentication headers, base URL changes, retry logic) requires touching all 8 files. A shared client eliminates that duplication and is the foundation for all other improvements.

**Independent Test**: Can be fully tested by verifying that a single configuration point (base URL, shared headers) is applied to all network calls without modifying individual call sites.

**Acceptance Scenarios**:

1. **Given** the codebase has multiple files making HTTP requests, **When** the base URL needs to change, **Then** only one location needs to be updated.
2. **Given** a shared client is configured, **When** a new default header is required for all requests, **Then** adding it to the shared client automatically applies it everywhere.
3. **Given** the shared client exists, **When** a developer adds a new HTTP call, **Then** they can extend the shared client instead of writing a new fetch call from scratch.

---

### User Story 2 - Consistent Error Handling Across All Requests (Priority: P2)

A developer debugging a network failure wants clear, consistent error handling at every call site so that HTTP error responses (404, 401, 500, etc.) are handled predictably without manually checking `response.ok` in each file.

**Why this priority**: Inconsistent error handling across 8 call sites is a reliability risk. Standardizing it reduces bugs and makes the codebase easier to reason about, but existing functionality can work without it (it degrades gracefully).

**Independent Test**: Can be tested by triggering specific HTTP error codes (404, 401, 500) and verifying each is handled consistently across all call sites.

**Acceptance Scenarios**:

1. **Given** a request returns a 404 status, **When** the response is processed, **Then** the error is handled consistently regardless of which file made the request.
2. **Given** a request returns a 401 status, **When** the response is processed, **Then** all call sites react in the same way without duplicated `if (!response.ok)` checks.
3. **Given** a network timeout or server error occurs, **When** the error propagates, **Then** the developer receives a clear, typed error object rather than a raw response.

---

### User Story 3 - Fluent Request Composition (Priority: P3)

A developer adding a new API call wants to compose requests in a readable, chainable style so that request configuration (URL, body, headers) is expressed clearly without verbose boilerplate.

**Why this priority**: Developer experience improvement. Existing calls already work; this story is about reducing boilerplate and making future development faster and less error-prone.

**Independent Test**: Can be tested by adding a new API call using the fluent interface and verifying it works correctly end-to-end.

**Acceptance Scenarios**:

1. **Given** a POST request needs a JSON body, **When** written using the new client, **Then** the body is serialized automatically without manual `JSON.stringify` and `Content-Type` header setup.
2. **Given** a GET request needs query parameters, **When** parameters are passed as an object, **Then** they are correctly appended to the URL.
3. **Given** an existing fetch call is migrated, **When** the migrated version runs, **Then** the observable behavior is identical to the original.

---

### Edge Cases

- What happens when a request is made before the shared client is initialized?
- How does the system handle requests that need to override the shared client's defaults (e.g., a call to a third-party API with a different base URL)?
- What happens when a call site expects the raw `Response` object rather than parsed JSON?
- Streaming responses (Ollama pull/model endpoints) use `.res()` to obtain the raw `Response` and stream the body manually; wretch still provides shared client configuration and error handling for non-OK statuses.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All existing fetch call sites (currently 8 files) MUST be migrated to use the new HTTP client wrapper.
- **FR-002**: Two separate shared client instances MUST be created: one for server-side API routes that call Ollama directly, and one for client-side components and hooks that call the app's own API. Each client centralizes its own base URL and default configuration.
- **FR-003**: The migrated code MUST preserve all existing observable behavior — request payloads, response parsing, and error propagation MUST remain identical from the application's perspective.
- **FR-004**: HTTP error status codes (4xx, 5xx) MUST be handled through the client's error-handling mechanism rather than manual `response.ok` checks.
- **FR-005**: Each shared client MUST support per-request URL extension so individual call sites can specify their endpoint path without repeating the base URL.
- **FR-006**: Streaming call sites MUST use the `.res()` terminal method to obtain the raw `Response` object and stream the body manually, while still routing through the shared client so that base URL, headers, and non-OK error handling remain consistent.
- **FR-007**: The wrapper library and its middleware companion (`wretch-middlewares`) MUST be added as production dependencies; MSW MUST be added as a dev dependency and used as the network-level mocking layer for all HTTP-related tests written during this migration.
- **FR-007a**: All existing automated tests MUST continue to pass after the migration — MSW handlers must cover all HTTP endpoints exercised by new tests without interfering with existing tests that do not make network calls.
- **FR-008**: Call sites that need to override shared defaults (e.g., calls to external URLs) MUST be able to do so without modifying the shared client.
- **FR-009**: The shared client MUST apply `retry()` middleware globally with the following behavior: retry on network errors and HTTP 5xx responses only, maximum 3 attempts, exponential backoff between retries. HTTP 4xx responses MUST NOT trigger a retry.
- **FR-010**: The shared client MUST apply `dedupe()` middleware globally to collapse identical in-flight requests, preventing duplicate network calls.

### Assumptions

- The existing 8 fetch call sites are the complete set; no dynamic or programmatic fetch calls exist outside of them.
- Streaming responses (Ollama pull/model endpoints) will require special handling since wretch's default terminal methods buffer the full response body.
- The project already has a compatible Node.js version (>=18) that supports native fetch, making a fetch polyfill unnecessary.
- Retry middleware is configured globally: max 3 attempts, exponential backoff, triggered only on network errors and HTTP 5xx responses. 4xx errors are not retried.
- Streaming endpoints (using `.res()`) will bypass dedupe/retry middleware or apply them only for the non-streaming portions of their lifecycle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 8 identified fetch call sites are replaced — zero raw `fetch(` calls remain in the `src/` directory after migration.
- **SC-002**: All existing automated tests pass after migrating their HTTP mocks to MSW request handlers — no test assertions or test logic should require changes beyond the mocking layer.
- **SC-003**: No regressions in application behavior — all API interactions (Ollama models, pull, route) work identically before and after migration.
- **SC-004**: Each shared client's configuration is defined in one location — adding a new default header to all server-side or all client-side calls requires a single line change, not modifying each individual call site.
- **SC-005**: Code review shows a net reduction in boilerplate lines — each migrated call site is equal to or shorter than the original.
