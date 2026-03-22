# Feature Specification: Code Quality & Refactor

**Feature Branch**: `002-code-quality-refactor`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "vamos a revisar el código y vamos a aplicar mejoras de rendimiento, de legibilidad, restructurando el código, creando custom hooks y utils/helpers reusables, vamos a reducir la complejidad ciclomática de los componentes partiéndolos en unidades de código más pequeñas, fáciles de entender y reusables, vamos a eliminar comentarios que no aportan nada y vamos a añadir documentación en forma de comentarios en el código donde no quede claro las decisiones técnicas/lógicas de implementación, vamos a mejorar el código en general"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Component Decomposition & Cyclomatic Complexity Reduction (Priority: P1)

A developer working on the codebase encounters large components with multiple responsibilities (e.g., `ChatContainer`, `ModelConfigPage`) that mix state management, business logic, and rendering. The goal is to split these into smaller, single-responsibility units that are easier to understand, test, and extend.

**Why this priority**: Reducing cyclomatic complexity directly improves testability, reduces the bug surface area, and makes onboarding faster. It unlocks all other improvements downstream.

**Independent Test**: Can be tested by reviewing individual component files — each component should have a single clear responsibility, and no component's render function should contain conditional logic branches exceeding 3 levels of nesting.

**Acceptance Scenarios**:

1. **Given** a component that both manages complex state AND renders UI, **When** it is refactored, **Then** state logic is extracted into a dedicated custom hook and the component only contains rendering logic.
2. **Given** any component file, **When** reviewed, **Then** it contains no inline business logic, no direct API calls, and no data transformation — only props consumption and rendering.
3. **Given** a custom hook extracted from a component, **When** tested in isolation, **Then** it behaves identically to the original embedded logic.

---

### User Story 2 - Custom Hooks & Reusable Utils/Helpers (Priority: P2)

A developer needs to reuse logic that currently lives inside specific components (e.g., conversation state management in `ChatContainer`, model config hydration in `ModelConfigPage`). The goal is to extract this logic into well-named custom hooks and utility functions that can be imported independently.

**Why this priority**: Reusable hooks and helpers eliminate code duplication, make logic unit-testable in isolation, and reduce the cognitive load of understanding each component.

**Independent Test**: Can be verified by confirming that extracted custom hooks and utility functions are each used in 2+ places, OR clearly encapsulate a single named concern (e.g., `useConversationHistory`, `useAbortableRequest`, `useSavingsTracking`).

**Acceptance Scenarios**:

1. **Given** logic duplicated across components, **When** refactored, **Then** it is extracted into a single shared hook or utility that all affected components import.
2. **Given** a custom hook, **When** its signature is read, **Then** its name clearly describes the concern it encapsulates (e.g., `useRouteMutation`, `useChatHistory`).
3. **Given** a utility function, **When** called with the same inputs, **Then** it always produces the same output (pure function — no side effects unless explicitly documented).

---

### User Story 3 - Performance Improvements (Priority: P3)

A developer reviews the rendering pipeline and identifies unnecessary re-renders, missing memoisation, and expensive computations repeated on every render. The goal is to apply targeted performance optimizations without premature abstraction.

**Why this priority**: Performance improvements are valuable but secondary to structural clarity. They should be applied where analysis shows a clear and measurable impact.

**Independent Test**: Can be tested by verifying that `babel-plugin-react-compiler` is installed and configured, that no manual `useCallback`/`useMemo` calls remain in the codebase, and that the build completes without compiler diagnostics.

**Acceptance Scenarios**:

1. **Given** the project build configuration, **When** the build runs, **Then** `babel-plugin-react-compiler` is active and processes all React components without errors.
2. **Given** any component or hook file in the codebase, **When** reviewed, **Then** it contains zero manual `useCallback` or `useMemo` calls — the compiler handles all memoisation automatically.
3. **Given** a component that previously required manual memoisation, **When** the compiler processes it, **Then** the compiled output is functionally equivalent and renders correctly in all existing test scenarios.

---

### User Story 4 - Comment Hygiene & Technical Documentation (Priority: P4)

A developer reads through the codebase and finds two types of comment problems: (a) noise comments that restate what the code already says, and (b) missing explanations for non-obvious technical decisions (e.g., why `min-h-0` is required in a flex layout, why fallback analysis is used when the analyst fails). The goal is to remove the former and add the latter.

**Why this priority**: Documentation quality has a direct impact on onboarding speed and long-term maintainability, but is lower priority than structural improvements.

**Independent Test**: Can be validated by reviewing all modified files — no comment should describe what the next line of code does; every remaining comment should answer "why" or explain a non-obvious constraint.

**Acceptance Scenarios**:

1. **Given** a comment that only restates the variable name or function call below it, **When** reviewed, **Then** it is removed because the code is already self-explanatory.
2. **Given** a comment explaining a non-obvious CSS layout constraint (e.g., `min-h-0` in a flex child), **When** reviewed, **Then** it is kept because the behaviour is not inferrable from the code alone.
3. **Given** a non-obvious routing fallback or algorithmic decision, **When** reviewed, **Then** it has a comment explaining the technical constraint or reasoning behind the approach.

---

### Edge Cases

- What happens when a component is refactored but its existing unit tests break? All test files must be updated alongside the refactor to maintain coverage parity.
- How does the system handle a hook that requires access to React context internally? The hook must still be extractable; it accesses context via `useContext` without coupling to a specific component tree.
- What if a utility function requires side effects (e.g., writing to `localStorage`)? Side effects must be explicitly documented in a comment on the function signature.
- What if splitting a component causes prop-drilling more than 2 levels deep? In that case, context or a compound component pattern must be preferred over additional prop passing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every component MUST have a single primary responsibility — either state management delegation OR rendering, not both.
- **FR-002**: State management logic and API interaction logic MUST be extracted into custom hooks when they exceed 3 lines of non-rendering code inside a component body.
- **FR-003**: Utility functions MUST be pure (no side effects) unless the side effect is documented explicitly in a comment on the function.
- **FR-004**: The React Compiler (`babel-plugin-react-compiler`) MUST be installed and configured as a Babel plugin in the Astro integration. All existing manual `useCallback` and `useMemo` calls MUST be removed — memoisation is fully delegated to the compiler.
- **FR-005**: No comment in any modified file SHALL describe what the adjacent code does; all comments MUST explain why a decision was made or clarify a non-obvious constraint.
- **FR-006**: Custom hooks MUST be named with the `use` prefix and placed under `src/hooks/` or a co-located `hooks/` subdirectory within the feature module.
- **FR-007**: Utility/helper functions MUST live under `src/lib/utils/` or a domain-specific subdirectory — never inlined inside component files.
- **FR-008**: After refactoring, all existing tests MUST pass without changes to test expectations (only import paths and test setup may change). Additionally, every newly extracted custom hook and utility function MUST have its own dedicated unit tests covering its primary behaviour and edge cases.
- **FR-009**: No new runtime dependencies SHALL be introduced. One new dev dependency is permitted and required: `babel-plugin-react-compiler`, used exclusively as a build-time transform. No other new packages may be added.
- **FR-010**: Components that receive more than 6 props MUST be reviewed for decomposition or replacement with a context/compound component pattern.

### Key Entities

- **Custom Hook**: A React hook encapsulating a named concern (state, side effects, derived values); lives in `src/hooks/` or a module-local `hooks/` directory; prefixed with `use`.
- **Utility Function**: A pure (or documented-impure) function encapsulating a reusable computation or transformation; lives in `src/lib/utils/` or a domain subdirectory.
- **Component**: A React function component responsible solely for rendering UI based on props and context; contains no inline business logic or direct API calls.
- **Technical Comment**: A code comment that explains a non-obvious implementation decision, constraint, or trade-off — not a description of what the code does.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every refactored component has a maximum cyclomatic complexity of 5 per function, verifiable via static analysis.
- **SC-002**: No component file in the primary target directories contains a direct `useState`, `useEffect`, `useRef`, or `useMutation` call when a custom hook already encapsulates that concern — verifiable via `grep -n "useState\|useEffect\|useRef\|useMutation" src/components/**/*.tsx` returning zero results in component render bodies after refactor.
- **SC-003**: Zero comments of the form "describe what the next line does" remain in any modified file after the refactor — all comments answer "why".
- **SC-004**: All existing unit tests continue to pass after the refactor, and every newly extracted hook and utility function has dedicated unit tests covering its primary behaviour and edge cases — overall test coverage percentage must not decrease.
- **SC-005**: No component in the primary target directories renders more than 50 lines of JSX (excluding import declarations and type definitions).
- **SC-006**: The React Compiler is active and all existing manual `useCallback`/`useMemo` calls have been removed from the codebase. The build output is verified to compile without compiler errors or warnings.
- **SC-007**: The codebase passes all existing lint rules with zero new warnings introduced after the refactor.

## Clarifications

### Session 2026-03-22

- Q: Should the refactor include writing new unit tests for extracted hooks and utility functions? → A: Yes — write new unit tests for each extracted hook and utility function.
- Q: Is `src/pages/api/` in scope for this refactor? → A: Yes — full first-class target, same rules as components (single responsibility, extract helpers, comment hygiene, new tests for extracted logic).
- Q: What is the memoisation strategy for `useMemo`/`useCallback`? → A: Add the React Compiler (`babel-plugin-react-compiler`) and delegate all memoisation to it; remove existing manual `useMemo`/`useCallback` calls as part of the refactor.
- Q: Are `.astro` page files in scope? → A: Yes — full targets; extract shared patterns duplicated across task pages (`tasks/commit.astro`, `tasks/explain.astro`, etc.) into reusable Astro components or layouts.
- Q: Should the refactor be delivered as one PR or split into slices? → A: Split by target area — each area is an independent deliverable: (0) React Compiler setup, (1) components + hooks, (2) lib/services/router, (3) API routes, (4) Astro pages.

## Assumptions

- The refactor is non-functional: external behaviour, routing logic, API contracts, and visual output MUST remain identical before and after.
- Primary refactoring targets are: `src/components/chat/`, `src/components/model/`, `src/lib/router/`, `src/lib/services/`, `src/hooks/`, `src/pages/api/`, and `src/pages/` (including `.astro` task pages). All targets are treated as first-class — single-responsibility, extraction of shared patterns, comment hygiene, and test/quality rules apply to all. For `.astro` files specifically, comment hygiene and readability rules apply. Structural extraction is only warranted if duplicated logic is found during the audit; the existing 5-line task pages already represent the minimum viable abstraction via `AppLayout` + `TaskApp`.
- Existing test files under `src/__tests__/` are treated as ground truth for correctness — if a refactor breaks a test expectation, the refactor must be reconsidered before the test is changed.
- TypeScript strict mode is already enforced; all refactored code must remain fully type-safe with no `any` types introduced.
- Memoisation is delegated entirely to the React Compiler (`babel-plugin-react-compiler`). No manual `useCallback` or `useMemo` calls are permitted in the codebase after this refactor.
- The `src/components/ui/` directory (shadcn/ui primitives) is out of scope for this refactor.
- Delivery is split into 5 independent slices by target area: (0) React Compiler install + config, (1) `src/components/` + `src/hooks/` decomposition and hook extraction, (2) `src/lib/` (router, services, utils), (3) `src/pages/api/` route handlers, (4) `src/pages/` Astro task pages. Each slice must pass all tests before the next begins.
