# Quickstart: Expand AI Tasks & Settings Redesign

**Branch**: `006-expand-ai-tasks-settings`

---

## What This Feature Adds

6 new AI-powered code assistant tasks with per-task model configuration and a redesigned settings page that scales to 12+ sections.

---

## Implementation Order

Follow this sequence to avoid type errors at each stage:

### Stage 1 — Schema & Types (no UI, no runtime changes)

1. **`src/lib/schemas/route.ts`** — Add 6 new values to `TaskTypeSchema`; add 6 optional model override fields to `RouteRequestSchema`.
2. **`src/components/model/settings/types.ts`** — Update `SectionId` and `SectionGroupId` types.
3. **`src/lib/config/model-config.ts`** — Add 6 new fields to `ModelConfig` interface and `DEFAULTS`; extend `TASK_MODEL_KEY` mapping.

At this point the project should still compile (new types, no consumers yet).

### Stage 2 — Model Lists & Prompts (pure data/functions)

4. **`src/lib/router/models/`** — Create 6 new model list files (docstring, type-hints, error-explain, performance-hint, naming-helper, dead-code). Update `index.ts`.
5. **`src/lib/prompts/`** — Create 6 new prompt builder files.
6. **`src/lib/router/direct.ts`** — Implement `routeDirect()` for the new task pathway.

### Stage 3 — API Route

7. **`src/pages/api/route.ts`** — Add new model fields to `ValidatedRequest`; branch on task type to use `routeDirect()` for new tasks; add env var resolution for 6 new models.

### Stage 4 — Settings UI

8. **`src/components/model/settings/constants.ts`** — Update `SECTIONS` array: rename existing group IDs; add 6 new `SectionDef` entries with correct group assignments.
9. **Settings tab component** — Update tab labels to match new group IDs (infrastructure / analysis / generation / language).

### Stage 5 — Task Pages & Navigation

10. **`src/pages/tasks/`** — Create 6 new `.astro` pages (standard `TaskApp` wrapper, except `error-explain` which needs a dual-input layout).
11. **`src/components/layout/AppSidebar.tsx`** — Add 6 new entries to `TASK_ITEMS`; add group labels for Analysis and Generation; extend `TASK_PATH_BY_TYPE`.
12. **`src/components/layout/OverviewTaskCards.tsx`** — Refactor to render tasks in two labeled groups (Analysis, Generation).

### Stage 6 — Error Explain Dual-Input UI

13. Create `src/components/chat/ErrorExplainApp.tsx` (or extend `TaskApp`) to render two text areas and handle client-side combination + inline validation.
14. Update `src/pages/tasks/error-explain.astro` to use this component.

---

## Key Files Touched

| File | Change |
|------|--------|
| `src/lib/schemas/route.ts` | +6 task types, +6 optional request fields |
| `src/lib/config/model-config.ts` | +6 ModelConfig fields, +6 TASK_MODEL_KEY entries |
| `src/components/model/settings/types.ts` | SectionId +6, SectionGroupId updated |
| `src/components/model/settings/constants.ts` | SECTIONS +6 entries, group IDs updated |
| `src/pages/api/route.ts` | Direct routing branch for new tasks |
| `src/lib/router/direct.ts` | NEW — direct route function |
| `src/lib/router/models/index.ts` | +6 exports, MODELS_BY_TASK, DEFAULT_MODELS updated |
| `src/lib/router/models/{6 new files}` | NEW — model option lists |
| `src/lib/prompts/{6 new files}` | NEW — system prompt builders |
| `src/pages/tasks/{6 new files}` | NEW — Astro task pages |
| `src/components/layout/AppSidebar.tsx` | +6 nav items, +2 group labels |
| `src/components/layout/OverviewTaskCards.tsx` | Grouped layout (Analysis / Generation) |
| `src/components/chat/ErrorExplainApp.tsx` | NEW — dual-input task component |

---

## Running the App

```bash
# Install dependencies (if not already done)
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

---

## Verifying New Tasks Work

1. Start Ollama: `ollama serve`
2. Pull a model for a new task: `ollama pull phi3.5`
3. Open `http://localhost:4321/tasks/error-explain`
4. Paste an error message → submit → verify streamed response
5. Open `http://localhost:4321/settings` → verify new tasks appear under Analysis/Generation tabs
6. Select a different model for a new task → reload → verify selection persists

---

## Prompt Output Contracts

| Task | Expected output format |
|------|----------------------|
| `docstring` | Original code with documentation comments added/updated |
| `type-hints` | Original code with type annotations added (no logic changes) |
| `error-explain` | Root-cause explanation paragraph + numbered fix steps |
| `performance-hint` | Bulleted advisory suggestions (no code rewrite) |
| `naming-helper` | List of `before → after` renames with one-line rationale each |
| `dead-code` | List of issues: name + approximate location + category |
