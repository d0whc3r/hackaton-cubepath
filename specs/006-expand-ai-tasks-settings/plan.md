# Implementation Plan: Expand AI Tasks & Settings Redesign

**Branch**: `006-expand-ai-tasks-settings` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-expand-ai-tasks-settings/spec.md`

---

## Summary

Add 6 new AI-assisted code tasks (Docstring, Type Hints, Error Explain, Performance Hint, Naming Helper, Dead Code), each with an independently configurable Ollama model, and redesign the settings page from 3 flat groups to 4 functional tabs (Infrastructure / Analysis / Generation / Language) to scale to 12+ sections. New tasks bypass the analyst router and call their specialist model directly. The home page task catalog is reorganized into two labeled groups matching the settings tabs.

---

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode)
**Primary Dependencies**: Astro 6.0.8, React 19, wretch, ai SDK (Ollama provider), Zod, Vitest 4.1.0
**Storage**: Browser `localStorage` (key: `slm-router-model-config`)
**Testing**: Vitest 4.1.0 + happy-dom + MSW 2.x
**Target Platform**: Browser (Astro SSR/CSR hybrid, Ollama running locally)
**Project Type**: Web application (Astro + React)
**Performance Goals**: New tasks stream first token in same latency envelope as existing tasks (no analyst overhead); no latency regression on existing tasks
**Constraints**: All new tasks bypass the analyst model; no new external dependencies required; backwards-compatible localStorage schema change
**Scale/Scope**: 6 new task types, 6 new model list files, 6 new prompt files, 6 new Astro pages, 1 new router module, 1 new UI component

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file is a blank template — no active principles or gates are defined. No violations to track.

**Post-design re-check**: N/A (no constitution principles to evaluate against).

---

## Project Structure

### Documentation (this feature)

```text
specs/006-expand-ai-tasks-settings/
├── plan.md              ← this file
├── spec.md
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── api-route.md     ← Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code

```text
src/
├── lib/
│   ├── config/
│   │   └── model-config.ts              UPDATE: +6 ModelConfig fields, +6 TASK_MODEL_KEY entries
│   ├── prompts/
│   │   ├── docstring.ts                 NEW
│   │   ├── type-hints.ts                NEW
│   │   ├── error-explain.ts             NEW
│   │   ├── performance-hint.ts          NEW
│   │   ├── naming-helper.ts             NEW
│   │   └── dead-code.ts                 NEW
│   ├── router/
│   │   ├── direct.ts                    NEW: direct routing (bypasses analyst)
│   │   └── models/
│   │       ├── docstring.ts             NEW
│   │       ├── type-hints.ts            NEW
│   │       ├── error-explain.ts         NEW
│   │       ├── performance-hint.ts      NEW
│   │       ├── naming-helper.ts         NEW
│   │       ├── dead-code.ts             NEW
│   │       └── index.ts                 UPDATE: +6 exports, MODELS_BY_TASK, DEFAULT_MODELS
│   └── schemas/
│       └── route.ts                     UPDATE: TaskTypeSchema +6, RouteRequestSchema +6 fields
├── components/
│   ├── chat/
│   │   └── ErrorExplainApp.tsx          NEW: dual-input component for error-explain
│   ├── layout/
│   │   ├── AppSidebar.tsx               UPDATE: +6 nav items, Analysis/Generation group labels
│   │   └── OverviewTaskCards.tsx        UPDATE: grouped layout (Analysis / Generation)
│   └── model/
│       └── settings/
│           ├── constants.ts             UPDATE: SECTIONS +6, group IDs renamed
│           └── types.ts                 UPDATE: SectionId +6, SectionGroupId updated
└── pages/
    ├── api/
    │   └── route.ts                     UPDATE: direct routing branch + 6 new model fields
    └── tasks/
        ├── docstring.astro              NEW
        ├── type-hints.astro             NEW
        ├── error-explain.astro          NEW
        ├── performance-hint.astro       NEW
        ├── naming-helper.astro          NEW
        └── dead-code.astro              NEW

tests/
└── (unit tests for new prompt builders and direct router)
```

**Structure Decision**: Single-project web application structure (existing layout). Feature adds files within the established `src/lib/`, `src/components/`, and `src/pages/` directories without introducing new top-level folders.

---

## Phase 0: Research

**Status**: Complete. See [research.md](./research.md).

### Key decisions resolved

| Decision | Resolution |
|----------|-----------|
| New task routing | `routeDirect()` — bypasses analyst, goes straight to specialist model |
| Error Explain dual input | Client-side combine into single formatted `input` string |
| `ModelConfig` evolution | Merge-over-defaults pattern — no migration needed |
| Settings group names | `infrastructure | analysis | generation | language` |
| Default models | phi3.5 for text-output tasks; qwen2.5-coder:7b for code-analysis tasks |
| Home page layout | Two labeled groups: Analysis, Generation |
| Empty input validation | Inline validation message on submit attempt |

---

## Phase 1: Design & Contracts

**Status**: Complete.

### Artifacts generated

- **[data-model.md](./data-model.md)**: Full schema changes — `TaskType`, `ModelConfig`, `RouteRequestSchema`, `SectionDef`, new module inventory.
- **[contracts/api-route.md](./contracts/api-route.md)**: SSE event sequences for existing (unchanged) and new (simplified) routing paths; new request fields; env vars.
- **[quickstart.md](./quickstart.md)**: Staged implementation order (6 stages), key files table, verification steps, prompt output contracts.

### Design summary

**Stage 1 — Schema & Types**: Extend `TaskTypeSchema`, `RouteRequestSchema`, `ModelConfig`, `SectionId`, `SectionGroupId` — pure type changes, project compiles at each step.

**Stage 2 — Model Lists & Prompts**: 6 model list files + 6 prompt builders + `routeDirect()` — pure functions, fully unit-testable without UI.

**Stage 3 — API Route**: Branch on `taskType` in `buildSSEStream()`. New tasks call `routeDirect()` and emit a simplified SSE sequence (only `generating_response` steps). Existing tasks unchanged.

**Stage 4 — Settings UI**: Update `SectionGroupId` mapping in the tab component; add 6 new `SectionDef` entries to `SECTIONS`; rename group IDs.

**Stage 5 — Task Pages & Navigation**: 5 standard Astro pages wrapping `<TaskApp fixedTaskType="..."/>`. Sidebar gains 6 items and two group labels.

**Stage 6 — Error Explain UI**: `ErrorExplainApp` renders two text areas, manages `touched` state for inline validation, and combines inputs before submission.

### Constitution re-check (post-design)

No active constitution principles — no violations.

---

## Complexity Tracking

No constitution violations requiring justification.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `SectionGroupId` rename breaks existing settings UI | Rename is compile-time only; no stored data references group IDs. Update all group references in one commit. |
| `TaskType` enum expansion breaks `TASK_MODEL_KEY` at runtime | TypeScript strict mode will catch missing entries at compile time. Extend the map in Stage 1 before any consumer is updated. |
| Error Explain prompt receives malformed combined input | Prompt builder explicitly handles the `ERROR:\n...\n\nCODE:\n...` format; gracefully falls back if `CODE:` section is absent. |
| Sidebar becomes too long with 10 task items | Sidebar already uses collapsible-icon mode; items remain usable. Group labels provide visual separation. |
| `MODELS_BY_TASK` type mismatch after TaskType expansion | Update `MODELS_BY_TASK` and `DEFAULT_MODELS` in Stage 2 immediately after Stage 1 type changes. |
