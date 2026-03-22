# Implementation Plan: Code Quality & Refactor

**Branch**: `002-code-quality-refactor` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-code-quality-refactor/spec.md`

---

## Summary

Non-functional, behaviour-preserving code quality refactor across the entire TypeScript/TSX/Astro codebase. Introduces the React Compiler (`babel-plugin-react-compiler`) to replace all manual memoisation, extracts business logic from components into purpose-built custom hooks, decomposes the `buildSSEStream` API handler into named single-responsibility functions, consolidates duplicated utilities (`resolveModel`, model config), and enforces comment hygiene throughout. All existing tests must pass; new unit tests are written for every extracted unit. Delivered in 5 independent slices.

---

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode)
**Runtime**: Node.js ≥ 24 (standalone Astro SSR)
**Framework**: Astro 6.0.8 + @astrojs/react 5.0.1
**UI Library**: React 19.2.4 (compiler runtime built-in)
**Build Tool**: Vite (embedded in Astro)
**Styling**: TailwindCSS 4.x + shadcn/ui primitives
**State Management**: React Context + @tanstack/react-query 5.x
**Testing**: Vitest 4.x + @testing-library/react 16.x + happy-dom
**Linting**: oxlint 1.56.0
**Formatter**: oxfmt
**New Dev Dependency**: `babel-plugin-react-compiler@1.0.0` (build-time transform only, no runtime cost)
**Performance Goals**: Zero regression in rendered output; compiler handles memoisation automatically
**Constraints**: No new runtime deps; TypeScript strict; all existing tests green; `src/components/ui/` out of scope
**Scale/Scope**: ~25 source files modified; 3 new hooks; 2 new lib modules; ~15 new test cases

---

## Constitution Check

> Constitution is not yet filled in for this project. Applying project-implied quality gates.

| Gate | Status | Notes |
|------|--------|-------|
| No new runtime dependencies | ✅ PASS | Only `babel-plugin-react-compiler` (devDep) |
| All existing tests pass | ✅ Required | Enforced by CI in every slice |
| TypeScript strict mode maintained | ✅ Required | No `any` types introduced |
| Lint rules pass with zero new warnings | ✅ Required | oxlint complexity rule added |
| Behaviour-preserving refactor | ✅ Required | Verified by existing test suite |
| `src/components/ui/` untouched | ✅ Explicit scope boundary | shadcn/ui primitives excluded |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-code-quality-refactor/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── hooks-api.md     ← hook + utility contracts
└── tasks.md             ← /speckit.tasks output (not yet created)
```

### Source Code — After Refactor

```text
src/
├── components/
│   ├── chat/
│   │   ├── TaskApp.tsx           (unchanged — already clean)
│   │   ├── ChatContainer.tsx     (render-only; delegates to useChatSession)
│   │   ├── ChatInput.tsx         (render-only; delegates to useChatInput + useFileAttachment)
│   │   ├── ChatMessages.tsx      (review — comment hygiene)
│   │   ├── AssistantBubble.tsx   (review — comment hygiene)
│   │   ├── UserBubble.tsx        (review — comment hygiene)
│   │   ├── RoutingProgress.tsx   (review — comment hygiene)
│   │   ├── EmptyState.tsx        (review — comment hygiene)
│   │   └── TranslateButton.tsx   (review — comment hygiene)
│   ├── model/
│   │   ├── ModelConfigDialog.tsx (component only — config logic moved to lib/config/)
│   │   ├── ModelConfigPage.tsx   (review — comment hygiene)
│   │   └── settings/             (already well-decomposed — comment hygiene only)
│   ├── layout/                   (review — comment hygiene)
│   ├── cost/                     (review — comment hygiene)
│   └── markdown/                 (review — comment hygiene)
│
├── hooks/
│   ├── use-mobile.ts             (existing — unchanged)
│   ├── use-chat-session.ts       [NEW] extracted from ChatContainer
│   ├── use-chat-input.ts         [NEW] extracted from ChatInput
│   └── use-file-attachment.ts    [NEW] extracted from ChatInput
│
├── lib/
│   ├── config/
│   │   └── model-config.ts       [NEW] moved from ModelConfigDialog.tsx
│   ├── api/
│   │   ├── sse.ts                (add ollamaClient deduplication note)
│   │   └── resolve-model.ts      [NEW] extracted from route.ts + translate.ts
│   ├── router/
│   │   ├── analyst.ts            (use shared ollamaClient from api/sse.ts)
│   │   ├── detector.ts           (review — comment hygiene)
│   │   ├── index.ts              (already clean)
│   │   ├── specialists.ts        (already clean — tiny optimisation possible)
│   │   ├── types.ts              (unchanged)
│   │   └── models/               (unchanged)
│   ├── services/
│   │   └── route.service.ts      (already clean — unchanged)
│   ├── schemas/
│   │   └── route.ts              (unchanged)
│   ├── utils/
│   │   ├── format.ts             (review)
│   │   ├── history.ts            (review)
│   │   ├── savings.ts            (review)
│   │   └── sse.ts                (already clean)
│   ├── context/
│   │   └── chat-context.ts       (unchanged — already clean)
│   └── prompts/                  (review — comment hygiene only)
│
├── pages/
│   ├── api/
│   │   ├── route.ts              (decompose buildSSEStream; use resolveModel; use shared ollamaClient)
│   │   └── translate.ts          (use resolveModel from lib; minor cleanup)
│   ├── tasks/
│   │   ├── commit.astro          (already minimal — comment hygiene only)
│   │   ├── explain.astro         (already minimal — comment hygiene only)
│   │   ├── refactor.astro        (already minimal — comment hygiene only)
│   │   └── test.astro            (already minimal — comment hygiene only)
│   ├── index.astro               (review)
│   └── settings.astro            (review)
│
└── __tests__/
    ├── hooks/                    [NEW directory]
    │   ├── use-chat-session.test.ts   [NEW]
    │   ├── use-chat-input.test.ts     [NEW]
    │   └── use-file-attachment.test.ts [NEW]
    ├── lib/
    │   ├── api/
    │   │   └── resolve-model.test.ts  [NEW]
    │   └── config/
    │       └── model-config.test.ts   [NEW]
    └── components/               (existing tests — import paths updated if needed)
```

**Structure Decision**: Single project web application (Astro SSR + React islands). The refactor introduces a `src/lib/config/` domain directory and a `src/lib/api/resolve-model.ts` utility, consistent with the existing `src/lib/` domain structure.

---

## Complexity Tracking

> No constitution violations requiring justification. All changes reduce complexity.

---

## Design Patterns Applied

### Patterns Introduced

| Pattern | Where Applied | Purpose |
|---------|--------------|---------|
| **Custom Hook** | `useChatSession`, `useChatInput`, `useFileAttachment` | Extract logic from components; enable isolated unit testing |
| **Orchestrator** | Refactored `buildSSEStream` | Reduce to pure coordination of named step functions |
| **Compiler-Driven Memoisation** | React Compiler replaces all `useCallback`/`useMemo` | Automatic, precise, zero-overhead memoisation |

### Patterns Already Present (Reinforce + Document)

| Pattern | Where | Documentation action |
|---------|-------|---------------------|
| **Factory** | `buildSpecialists`, `buildRouteMutationOptions`, `createSseStream` | Add JSDoc explaining the Factory intent |
| **Adapter** | `ollamaClient` in `src/lib/api/sse.ts` | Add comment explaining why OpenAI SDK wraps Ollama |
| **Strategy** | Router specialist selection in `route()` | Keep existing analyst comment; document fallback strategy |
| **Single Responsibility** | All refactored units | Enforced structurally — each file owns one concern |

### Anti-Patterns Removed

| Anti-Pattern | Where Found | Fix |
|-------------|-------------|-----|
| Mixed responsibility | `ChatContainer` (state + render) | Extract `useChatSession` |
| Mixed responsibility | `ChatInput` (file IO + submit logic + render) | Extract `useChatInput` + `useFileAttachment` |
| Misplaced utilities | `ModelConfigDialog.tsx` (exports config functions + component) | Move config to `src/lib/config/model-config.ts` |
| Code duplication | `resolveModel` in `route.ts` AND `translate.ts` | Extract to `src/lib/api/resolve-model.ts` |
| Duplicated client creation | `runAnalyst` creates its own Ollama client | Import `ollamaClient` from `src/lib/api/sse.ts` |
| Noise comments | Throughout codebase | Remove all "what" comments, keep only "why" |
| Manual memoisation | `useMemo` in `use-model-config-page.ts`, `useCallback` in `ChatContainer` | Remove — React Compiler handles these |

---

## Delivery Slices

Each slice is an independent unit: tests pass, lint passes, build succeeds before proceeding to the next.

### Slice 0: React Compiler Setup

**Files**: `astro.config.ts`, `vitest.config.ts`, `package.json`
**Changes**:
- `pnpm add -D babel-plugin-react-compiler`
- Add `babel: { plugins: [['babel-plugin-react-compiler']] }` to `react()` in `astro.config.ts`
- Add `babel: { plugins: [['babel-plugin-react-compiler']] }` to `react()` in `vitest.config.ts`
- Remove ALL existing `useCallback` and `useMemo` calls across the codebase (the compiler replaces them)
- Add `complexity: ['error', 5]` to `oxlint.config.ts`

**Verification**: `pnpm build` succeeds; `pnpm test` passes; `pnpm lint` passes with no new warnings

---

### Slice 1: Components + Hooks

**Files**:
- `src/hooks/use-chat-session.ts` [NEW]
- `src/hooks/use-chat-input.ts` [NEW]
- `src/hooks/use-file-attachment.ts` [NEW]
- `src/components/chat/ChatContainer.tsx` [SIMPLIFIED]
- `src/components/chat/ChatInput.tsx` [SIMPLIFIED]
- `src/__tests__/hooks/use-chat-session.test.ts` [NEW]
- `src/__tests__/hooks/use-chat-input.test.ts` [NEW]
- `src/__tests__/hooks/use-file-attachment.test.ts` [NEW]

**Changes**:
- Extract `useChatSession` from `ChatContainer` (state, effects, mutation, handlers)
- Extract `useChatInput` + `useFileAttachment` from `ChatInput`
- `ChatContainer` becomes a context provider + `<ChatMessages /><ChatInput />` composition
- `ChatInput` becomes pure rendering consuming hook return values
- Comment hygiene pass over all components in `src/components/`

**Verification**: All existing component tests pass; new hook tests green; components still render correctly

---

### Slice 2: Config + Lib Layer

**Files**:
- `src/lib/config/model-config.ts` [NEW]
- `src/components/model/ModelConfigDialog.tsx` [SIMPLIFIED — component only]
- All files importing from `ModelConfigDialog` [IMPORT PATH UPDATES]
- `src/__tests__/lib/config/model-config.test.ts` [NEW]
- `src/lib/router/analyst.ts` [DEDUPLICATE ollamaClient]
- `src/lib/utils/format.ts`, `history.ts`, `savings.ts` [COMMENT HYGIENE]
- `src/lib/prompts/` [COMMENT HYGIENE]
- `src/lib/router/detector.ts`, `specialists.ts` [COMMENT HYGIENE + minor optimisations]

**Changes**:
- Move config utilities from `ModelConfigDialog.tsx` → `src/lib/config/model-config.ts`; `ModelConfigDialog` exports only the nav button component; update all import paths
- `analyst.ts`: replace inline `createOpenAI({ apiKey: 'ollama', ... })` with imported `ollamaClient` from `src/lib/api/sse.ts`
- Comment hygiene across all `src/lib/` files
- Document the Adapter pattern usage of `ollamaClient` with a "why" comment in `sse.ts`
- Document the Strategy pattern in `route()` and the Analyst fallback reasoning

**Verification**: All existing lib tests pass; new model-config tests green; no behaviour change

---

### Slice 3: API Route Handlers

**Files**:
- `src/lib/api/resolve-model.ts` [NEW]
- `src/pages/api/route.ts` [DECOMPOSED]
- `src/pages/api/translate.ts` [USE SHARED resolveModel]
- `src/__tests__/lib/api/resolve-model.test.ts` [NEW]

**Changes**:
- Extract `resolveModel` to `src/lib/api/resolve-model.ts`
- Decompose `buildSSEStream` in `route.ts` into: `emitLanguageDetection`, `emitTaskAnalysis`, `emitSpecialistSelection`, `streamSpecialistResponse`
- `route.ts` and `translate.ts` import `resolveModel` from shared module
- Comment hygiene: keep "auto-continue on length finish reason" comment; keep "5-minute timeout" comment with reasoning; remove decorative section dividers (replace with function extraction)

**Verification**: All existing API/service tests pass; new `resolveModel` tests green; SSE streaming behaviour unchanged

---

### Slice 4: Astro Pages + Final Audit

**Files**:
- `src/pages/tasks/*.astro` [COMMENT HYGIENE]
- `src/pages/index.astro`, `src/pages/settings.astro` [REVIEW]
- `src/layouts/AppLayout.astro` [REVIEW]
- `src/components/Navbar.astro` [REVIEW]

**Changes**:
- Comment hygiene pass over all `.astro` files
- Verify no duplication has crept into task pages (already confirmed minimal — no structural extraction needed)
- Final lint + complexity check across all modified files
- Update checklist at `specs/002-code-quality-refactor/checklists/requirements.md`

**Verification**: Full test suite green; `pnpm build` succeeds; `pnpm lint` zero warnings; cyclomatic complexity ≤ 5 for all functions in modified files

---

## Quickstart for Implementation

See [quickstart.md](./quickstart.md) for step-by-step commands.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| React Compiler fails on an existing pattern | Low | High | Run `pnpm build` immediately after Slice 0; compiler emits actionable diagnostics |
| Hook extraction breaks existing component tests | Medium | Medium | Update test imports alongside code; component tests use `renderHook` + `ChatContext.Provider` |
| Import path changes from ModelConfigDialog split break builds | Medium | Low | TypeScript compiler catches all broken imports at build time |
| Manual `useCallback`/`useMemo` removal causes regression | Low | Low | Compiler re-introduces memoisation where needed; existing tests catch regressions |
| oxlint complexity rule fails on currently-clean functions | Low | Low | Slice 0 includes a lint audit run before making other changes |
