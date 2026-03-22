# Feature Specification: Centralized Storage Hook with Attempt Helper

**Feature Branch**: `003-storage-hook-attempt`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "centralizar los local/session storage, crear un hook para eso y usarlo siempre que se necesite leer/escribir/eliminar algo del local/session storage. usaremos un helper de 'attempt' que es un nuevo helper que tenemos que crear para esas acciones que puedan requerir un try/catch, y así centralizar también el manejo de errores que puedan surgir de ahí."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Safe Storage Read (Priority: P1)

A developer reads a value from storage (local or session) through the centralized hook or utility. If the stored value is missing, corrupt, or the storage is unavailable, the operation returns a safe default and records the error — without crashing the application.

**Why this priority**: Reading from storage is the most frequent operation across the app (model config, history, savings, theme, sidebar). Centralizing error handling here prevents scattered silent failures and unhandled exceptions on quota errors or browser restrictions.

**Independent Test**: Can be fully tested by calling the storage read path with: (a) a valid value, (b) a missing key, (c) corrupt JSON, and (d) storage access blocked — all returning predictable outcomes without throwing.

**Acceptance Scenarios**:

1. **Given** a key with a valid JSON value in localStorage, **When** the storage hook reads that key, **Then** it returns the parsed value.
2. **Given** a key not present in localStorage, **When** the storage hook reads that key, **Then** it returns `null` (or the specified default) without throwing.
3. **Given** a key containing malformed JSON, **When** the storage hook reads that key, **Then** it returns `null` (or the specified default) and the error is captured by the `attempt` helper.
4. **Given** storage access is blocked (e.g., private mode restrictions), **When** a read is attempted, **Then** the error is captured and a safe fallback is returned.

---

### User Story 2 - Safe Storage Write (Priority: P1)

A developer writes a value to storage through the centralized hook or utility. If the write fails (e.g., quota exceeded, security error), the error is captured and surfaced in a controlled way — not as an uncaught exception.

**Why this priority**: Write failures are the most common storage error in production (QuotaExceededError). Currently they are unhandled throughout the codebase; centralizing them eliminates the risk of crashing the app silently.

**Independent Test**: Can be fully tested by writing a valid value, then simulating a quota-exceeded condition — verifying the attempt helper captures the error and returns a failure result.

**Acceptance Scenarios**:

1. **Given** available storage space, **When** the storage hook writes a value to a key, **Then** the value is persisted and the operation signals success.
2. **Given** storage quota is exceeded, **When** a write is attempted, **Then** the error is captured by the `attempt` helper and the operation signals failure without throwing.
3. **Given** storage access is restricted, **When** a write is attempted, **Then** the error is captured and a failure result is returned.

---

### User Story 3 - Safe Storage Delete (Priority: P2)

A developer removes a key from storage through the centralized hook or utility. The delete operation never throws, even if the key doesn't exist or storage is unavailable.

**Why this priority**: Deletion is less risky than reads/writes but must still be safe. Centralizing it completes the full CRUD surface and ensures consistency.

**Independent Test**: Can be fully tested by removing an existing key, a nonexistent key, and by simulating a restricted storage environment — all without throwing.

**Acceptance Scenarios**:

1. **Given** an existing key in localStorage, **When** the storage hook removes that key, **Then** the key is gone and the operation signals success.
2. **Given** a key not present in localStorage, **When** the storage hook removes it, **Then** the operation completes without error.
3. **Given** storage access is restricted, **When** a removal is attempted, **Then** the error is captured and a failure result is returned.

---

### User Story 4 - Migrate All Existing Storage Usages (Priority: P2)

All existing direct calls to `localStorage` and `sessionStorage` across the codebase are replaced with the new centralized hook or utility. No component or module accesses the Web Storage API directly after this migration.

**Why this priority**: The hook and `attempt` helper provide zero value if the old direct calls remain. Completeness is necessary for the centralization goal to be achieved.

**Independent Test**: Can be verified by searching the codebase for direct `localStorage`/`sessionStorage` references — the result should be zero (or only within the centralized module itself).

**Acceptance Scenarios**:

1. **Given** the migration is complete, **When** the codebase is searched for direct `localStorage` or `sessionStorage` calls outside the storage module, **Then** no matches are found.
2. **Given** each migrated site, **When** its behavior is exercised in tests, **Then** it produces identical outcomes as before migration. *(Note: full automated regression coverage exists only for `model-config.ts` and `use-persisted-model-config.ts`. For `history.ts`, `savings.ts`, `ThemeToggle.tsx`, and `sidebar.tsx`, verification is manual/behavioral.)*

---

### Edge Cases

- What happens when storage is fully unavailable (e.g., incognito mode with strict settings)?
- How does the hook behave during server-side rendering when `window` is not defined?
- What happens when the `attempt` helper receives a synchronous throw vs. a rejected promise?
- How does the system handle reading a key written by an older version of the app with a different schema?

## Clarifications

### Session 2026-03-22

- Q: Should the storage hook re-render its consumers when the stored value changes externally? → A: Reactive — hook listens to storage events and re-renders consumers on external changes (cross-tab and same-page non-hook writes).
- Q: When an operation fails and the error is captured, what should happen with that error? → A: Exposed — the hook returns an `error` field alongside the value; utility functions return the `attempt` result directly so callers can inspect if they choose.
- Q: Should the storage module expose both a React hook and plain utility functions? → A: Two-layer — plain utility functions for read/write/delete (usable in any `.ts` file) + a React hook that wraps them and adds reactivity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an `attempt` helper that wraps any synchronous or asynchronous operation in a try/catch and returns a typed result (success value or error) instead of throwing. The helper MUST accept an optional fallback — a value or zero-argument function of the same type — that is used as the result when the main operation fails: if the fallback is a function and it succeeds, the result is `{ ok: true, value: fallbackValue }`; if the fallback also fails, the result is `{ ok: false, error: originalError }`.
- **FR-002**: The system MUST provide a centralized storage module (hook and/or utility functions) that exposes read, write, and delete operations for both `localStorage` and `sessionStorage`.
- **FR-003**: Every storage read, write, and delete operation MUST be executed through the `attempt` helper so that exceptions are always captured and never propagate unhandled.
- **FR-004**: The storage module MUST support an optional default value for read operations, returned when the key is absent or the stored value cannot be parsed.
- **FR-005**: The storage module MUST accept a storage type parameter to select between `localStorage` and `sessionStorage`, defaulting to `localStorage`.
- **FR-006**: All existing direct `localStorage` and `sessionStorage` usages across the codebase MUST be replaced with calls to the centralized storage module.
- **FR-007**: The `attempt` helper MUST be general-purpose and usable for any operation that may throw, not limited to storage.
- **FR-008**: The system MUST handle SSR gracefully — `readStorage` called in a non-browser environment MUST return `{ ok: true, value: defaultValue ?? null }` without throwing (a successful result with the safe default). `writeStorage` and `removeStorage` in SSR MUST return `{ ok: false, error }` without throwing (a graceful failure, since no write occurred).
- **FR-009**: The storage module MUST support JSON serialization/deserialization automatically so callers work with typed values, not raw strings.
- **FR-010**: The storage hook MUST subscribe to the browser `storage` event and re-render consumers whenever the stored value changes from other browser tabs. Same-page reactivity is guaranteed only for writes made through the hook's own `set`/`remove` functions (which update React state directly). Direct `writeStorage`/`removeStorage` calls from non-hook code in the same page do not trigger hook re-renders.
- **FR-011**: The storage hook MUST expose a last-captured `error` field (alongside the current value) so consumers can optionally react to storage failures. Utility functions MUST return the raw `attempt` result so non-React callers can inspect success or failure.
- **FR-012**: The storage module MUST be structured in two layers: (1) plain utility functions for read, write, and delete that can be called from any `.ts` or `.tsx` file without hook restrictions, and (2) a React hook that wraps those utilities and adds reactivity. Non-React modules (`history.ts`, `savings.ts`, `model-config.ts`, etc.) MUST use the utility layer directly.

### Key Entities

- **`attempt` helper**: A general-purpose utility that executes a function inside a try/catch and returns a discriminated union result — either success with a value or failure with a captured error. Supports both synchronous and asynchronous operations.
- **Storage utilities**: Plain functions (layer 1) for read, write, and delete over the Web Storage API. Use `attempt` internally, return the `attempt` result to callers, and handle JSON serialization automatically. Callable from any module, including non-React files.
- **Storage hook**: A React hook (layer 2) built on top of the storage utilities. Returns a stateful `{ value, error, set, remove }` shape and subscribes to the browser `storage` event to stay in sync with external changes.
- **Storage key**: A string identifier for a stored value. Existing keys (model config, history, savings, theme, sidebar width) continue to work unchanged after migration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero unhandled exceptions reach the user interface from any storage operation — all errors are captured and produce a defined fallback behavior.
- **SC-002**: All existing storage-dependent features (model config persistence, chat history, savings tracking, theme preference, sidebar width) continue to work identically after migration.
- **SC-003**: The codebase contains no direct calls to `localStorage` or `sessionStorage` outside the centralized storage module.
- **SC-004**: The `attempt` helper is reusable — it is used for storage operations and available for other error-prone operations without modification.
- **SC-005**: New storage-related unit tests achieve coverage of all error paths: missing key, corrupt JSON, quota exceeded, storage unavailable, and SSR environment.

## Assumptions

- `localStorage` is the primary storage target; `sessionStorage` is currently unused but the abstraction will support it for future use.
- The `attempt` helper will return a discriminated union result for both synchronous and asynchronous operations.
- No encryption or storage quota management beyond error capture is in scope for this feature.
- The existing storage keys (strings) remain unchanged; this feature only changes how the storage API is accessed, not what is stored.
- The project runs in a browser environment for all interactive usage; SSR is a secondary concern but must not crash.
- **Exception to SC-003**: `src/layouts/AppLayout.astro` contains a direct `localStorage.getItem('theme')` call inside an Astro `is:inline` script (the FOCT-prevention theme initializer). This script runs before React hydration to prevent flash of incorrect theme and cannot use ESM imports; it is therefore exempt from the "no direct localStorage" rule. SC-003 and T018 verification must exclude `.astro` files from the grep scan.
