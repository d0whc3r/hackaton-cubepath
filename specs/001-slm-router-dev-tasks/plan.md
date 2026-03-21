# Implementation Plan: Intelligent SLM Router for Developer Tasks

**Branch**: `001-slm-router-dev-tasks` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)

## Summary

A web application that accepts developer code snippets, routes each request to a specialized small language model based on the selected task type (explain, test, refactor, commit) and detected programming language, and streams both the routing decision and the model response back to the user in real-time. A live cost comparison demonstrates the efficiency advantage of small specialized models versus a single large general-purpose model.

## Technical Context

**Language/Version**: TypeScript 5.9 / Node.js >= 24
**Primary Dependencies**: Astro 6 (SSR, Node standalone), React 19, Tailwind CSS 4, shadcn/ui, Vercel AI SDK (`ai` + `@ai-sdk/openai`)
**AI Runtime**: Ollama — runs locally for dev, on a separate VPS for production; exposed via OpenAI-compatible HTTP API
**Storage**: None — stateless, no persistence
**Testing**: Vitest + happy-dom (component tests via `@testing-library/react`); no E2E
**Target Platform**: Docker + Node.js (Astro standalone adapter, already configured)
**Project Type**: Web application — Astro SSR + React interactive islands
**Performance Goals**: First routing step visible < 200ms; full response within 10s (CPU inference)
**Constraints**: Ollama VPS must be reachable from the app container; no GPU assumed; no overkill
**Scale/Scope**: Single-user demo

## Constitution Check

Constitution template is blank — no project-level gates in force. Standard discipline applies:

- [x] No persistence, no auth, no multi-tenancy
- [x] Stateless design — Astro Node standalone + Docker
- [x] No E2E tests in scope
- [x] Single Astro project — no monorepo splits
- [x] Ollama on separate VPS — app container calls it via HTTP; no GPU required

## Project Structure

### Documentation (this feature)

```text
specs/001-slm-router-dev-tasks/
├── plan.md              ← this file
├── research.md          ← technology findings and risk notes
├── data-model.md        ← TypeScript types and SSE event schema
├── quickstart.md        ← local dev and deployment guide
├── contracts/
│   └── api-route.md     ← POST /api/route SSE contract
└── checklists/
    └── requirements.md  ← spec quality checklist
```

### Source Code

```text
src/
├── pages/
│   ├── index.astro                    # Main page — mounts <App client:load />
│   └── api/
│       └── route.ts                   # POST /api/route — SSE streaming handler
│
├── components/
│   ├── ui/                            # shadcn primitives (already exists)
│   ├── App.tsx                        # Root island: state + SSE wiring
│   ├── TaskPanel.tsx                  # Task selector + textarea input + cancel
│   ├── RoutingPanel.tsx               # Animated routing step visualizer
│   ├── ResponsePanel.tsx              # Streaming response display + copy button
│   ├── CostBadge.tsx                  # Cost comparison display
│   └── HistoryPanel.tsx               # Session history (50 items, 10 visible + Load more)
│
└── lib/
    ├── utils.ts                       # Already exists (shadcn cn())
    ├── router/
    │   ├── index.ts                   # Router: detect → select → build prompt
    │   ├── detector.ts                # Heuristic language detection
    │   ├── specialists.ts             # Specialist registry + system prompt builders
    │   └── types.ts                   # Shared router types (TaskType, RoutingDecision…)
    └── cost/
        └── calculator.ts             # Token estimation + cost comparison

src/__tests__/
├── lib/
│   ├── router/
│   │   ├── detector.test.ts          # Unit: language detection heuristics
│   │   ├── specialists.test.ts       # Unit: specialist lookup + prompt building
│   │   └── router.test.ts            # Unit: routing decisions per task type
│   └── cost/
│       └── calculator.test.ts        # Unit: token estimation + savings %
└── components/
    ├── TaskPanel.test.tsx             # Component: task selection, submit state, cancel
    ├── RoutingPanel.test.tsx          # Component: step rendering, state transitions
    ├── ResponsePanel.test.tsx         # Component: streaming text, interrupted state, copy
    ├── CostBadge.test.tsx             # Component: cost formatting + label
    └── HistoryPanel.test.tsx          # Component: history rendering, load more, re-use

# Deployment
Dockerfile                             # Astro app — Node standalone build
docker-compose.yml                     # Local dev: app + ollama services
.env.example                           # Required env vars documented
```

**Structure Decision**: Single Astro project with Node standalone adapter (already active in `astro.config.ts`). API routes in `src/pages/api/` run as Node.js handlers. React islands handle all interactivity. Tests co-located under `src/__tests__/` mirroring the source tree. Docker Compose wires the app to a local Ollama container for development.

## Architecture: Routing Flow

```
User selects task type + pastes input
          │
          ▼
POST /api/route
          │
          ├─ 1. Validate input
          │
          ├─ 2. Detect language  (detector.ts — synchronous heuristic)
          │        emit: routing_step { detecting_language → done, detail: "TypeScript" }
          │
          ├─ 3. Resolve specialist  (router/index.ts)
          │        task type → specialists registry lookup
          │        emit: routing_step { analyzing_task → done }
          │        emit: routing_step { selecting_specialist → done }
          │        emit: specialist_selected { id, displayName, reason, language }
          │
          ├─ 4. Build system prompt  (specialist.buildSystemPrompt(lang, input))
          │
          ├─ 5. Call model via Vercel AI SDK  (streamText)
          │        emit: routing_step { generating_response → active }
          │        for each chunk: emit response_chunk { text }
          │
          ├─ 6. Calculate cost  (calculator.ts)
          │        emit: cost { inputTokens, outputTokens, specialistCostUsd,
          │                     largeModelCostUsd, savingsPct }
          │
          └─ 7. emit: done {}
```

## AI SDK Integration

The **Vercel AI SDK** (`ai`) provides a unified `streamText()` call across providers. Ollama is accessed via `@ai-sdk/openai` pointed at Ollama's OpenAI-compatible endpoint (`/v1`).

```typescript
// src/pages/api/route.ts (simplified)
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { buildSpecialists } from "../lib/router/specialists";
import { route } from "../lib/router/index";

const specialists = buildSpecialists({
  explainModel: process.env.OLLAMA_EXPLAIN_MODEL ?? "phi3.5",
  codeModel: process.env.OLLAMA_CODE_MODEL ?? "qwen2.5-coder:7b",
});

const decision = route(taskType, input, specialists);

const ollama = createOpenAI({
  baseURL: (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434") + "/v1",
  apiKey: "ollama",   // Ollama ignores the key; required by SDK type
});

const result = streamText({
  model: ollama(decision.specialist.modelId),
  system: decision.systemPrompt,
  prompt: input,
});
```

Swapping a specialist to a different provider only requires changing `baseURL` and `modelId` — routing logic is unaffected. For production, `OLLAMA_BASE_URL` points to the Ollama VPS (`http://<vps-ip>:11434`).

## Specialist Registry & Model Selection

Four entries in `SPECIALISTS: Record<TaskType, SpecialistConfig>`. Models are pulled via Ollama and run locally or on the Ollama VPS.

| TaskType | Specialist ID | Ollama Model | RAM (Q4) | HuggingFace |
|---|---|---|---|---|
| `explain` | `explanation-specialist` | `phi3.5` | ~2.5 GB | [microsoft/Phi-3.5-mini-instruct](https://huggingface.co/microsoft/Phi-3.5-mini-instruct) |
| `test` | `test-specialist` | `qwen2.5-coder:7b` | ~4.7 GB | [Qwen/Qwen2.5-Coder-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct) |
| `refactor` | `refactor-specialist` | `qwen2.5-coder:7b` | ~4.7 GB | [Qwen/Qwen2.5-Coder-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct) |
| `commit` | `commit-specialist` | `qwen2.5-coder:7b` | ~4.7 GB | [Qwen/Qwen2.5-Coder-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct) |

**Model rationale**:
- **`phi3.5`** (3.8B, Microsoft): outstanding instruction-following and natural language clarity for explanation tasks; only ~2.5 GB Q4 — fast even on CPU.
- **`qwen2.5-coder:7b`** (7B, Alibaba/Qwen): top HumanEval score (76%) among sub-8B models; trained for code generation, transformation, and understanding — ideal for test generation, refactoring, and commit messages.

**VPS sizing**: with Q4_K_M quantization both models in memory simultaneously require ~8 GB RAM. A basic 8–16 GB VPS suffices; no GPU needed.

**Lighter alternative** (if VPS has < 8 GB RAM): replace `qwen2.5-coder:7b` with `qwen2.5-coder:3b` (~2.3 GB) — reduced output quality but runs on any VPS.

`refactor-specialist`, `test-specialist`, and `commit-specialist` use the same `modelId` but are **separate `SpecialistConfig` objects** with distinct `id`, `displayName`, and `buildSystemPrompt`. This makes the SLM-MUX concept explicit: routing = model selection + prompt engineering.

## Ollama Deployment Architecture

```
┌─────────────────────────────┐        ┌───────────────────────────────┐
│   App VPS (Docker)          │        │   Ollama VPS                  │
│                             │        │                               │
│  ┌─────────────────────┐    │  HTTP  │  ollama/ollama                │
│  │  Astro Node (4321)  │────┼───────▶│  :11434                       │
│  └─────────────────────┘    │        │                               │
│                             │        │  Models pulled:               │
└─────────────────────────────┘        │  • phi3.5                     │
                                       │  • qwen2.5-coder:7b           │
          Local dev                    └───────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  docker-compose.yml                             │
│                                                 │
│  app (Astro :4321) ──────▶ ollama (:11434)      │
│                             └─ phi3.5           │
│                             └─ qwen2.5-coder:7b │
└─────────────────────────────────────────────────┘
```

### Dockerfile (Astro app)

Multi-stage build using Node 24 alpine. Astro Node standalone adapter outputs `dist/server/entry.mjs`.

```dockerfile
FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
```

### docker-compose.yml (local dev)

```yaml
services:
  app:
    build: .
    ports:
      - "4321:4321"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_EXPLAIN_MODEL=phi3.5
      - OLLAMA_CODE_MODEL=qwen2.5-coder:7b
    depends_on:
      ollama:
        condition: service_healthy

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    healthcheck:
      test: ["CMD", "ollama", "list"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  ollama_data:
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint (local or VPS) |
| `OLLAMA_EXPLAIN_MODEL` | `phi3.5` | Model for explanation tasks |
| `OLLAMA_CODE_MODEL` | `qwen2.5-coder:7b` | Model for test/refactor/commit tasks |
| `HOST` | `0.0.0.0` | Astro server bind address |
| `PORT` | `4321` | Astro server port |

### Model Pull (first-time setup)

```bash
# Pull models into Ollama (run once on each machine/VPS)
ollama pull phi3.5
ollama pull qwen2.5-coder:7b

# Or the lighter variant if RAM < 8 GB:
ollama pull qwen2.5-coder:3b
```

## Cost Calculation

Token estimation: `Math.ceil(charCount / 4)` for both input and output (standard heuristic).

Reference prices (estimated, clearly labelled in UI):

| Model tier | Price / token |
|---|---|
| Specialist (small, 1.5B–8B) | ~$0.000001 |
| Large model equivalent (GPT-4o class) | ~$0.000015 |

`savingsPct = Math.round((1 - specialistCostUsd / largeModelCostUsd) * 100)`

## UI Components

### `App.tsx`
State: `routingSteps`, `specialist`, `responseText`, `cost`, `isLoading`, `error`, `interrupted`, `history` (max 50 items).
Opens a `fetch` POST with streaming body (`ReadableStream` reader), parses SSE lines, dispatches to state. On `interrupted` event, preserves any partial `responseText`. Exposes cancel callback (AbortController) and edit+resend from history. Composes all panels.

### `TaskPanel.tsx`
4-option task selector (tab strip) + single `<textarea>` (no mode switching). Submit button disabled while `isLoading`. Cancel button visible and enabled while `isLoading`. Emits `onSubmit(input, taskType)` and `onCancel()`.

### `RoutingPanel.tsx`
4 steps rendered as a vertical list. Each step: icon + label + status indicator (spinner / check / error). Fades in as SSE `routing_step` events arrive. Shows specialist badge + language chip once `specialist_selected` fires.

### `ResponsePanel.tsx`
Append-only text as `response_chunk` events arrive. Header shows specialist `displayName`. Handles empty, error, and interrupted states (shows "interrupted — partial output below" notice). Includes Copy button that copies response text only (not input).

### `CostBadge.tsx`
Renders after `cost` event. Shows specialist cost, large-model cost, and savings % with green highlight. "Estimated" label always visible. Hidden until `cost` event received.

### `HistoryPanel.tsx`
Renders up to 10 most recent session history items by default with a "Load more" button for older ones (max 50 total). Each item shows task type, truncated input, and a "Re-use" button that populates the input area. Hidden when history is empty.

## Testing Strategy

**Vitest + happy-dom** — configured in `vitest.config.ts`.

**Unit tests** (`src/__tests__/lib/`): pure functions only, no mocks of external services.
- `detector.test.ts` — covers ≥10 language patterns + "unknown" fallback
- `specialists.test.ts` — covers all 4 task type → specialist mappings + prompt output
- `router.test.ts` — covers full routing decision output per task type
- `calculator.test.ts` — covers token math, cost formula, edge cases (0 tokens, 100% savings)

**Component tests** (`src/__tests__/components/`): use `@testing-library/react` + happy-dom.
- Render in isolation, assert DOM output and user interaction
- No real SSE or AI calls — tests inject props/state directly
- No snapshots; assert on meaningful text and ARIA roles

No E2E tests in scope.

## Implementation Phases

### Phase 1 — Setup & Core Logic
1. Install Vitest + happy-dom + `@testing-library/react`, configure `vitest.config.ts`
2. Install `ai` + `@ai-sdk/openai`, confirm types resolve
3. Create `Dockerfile`, `docker-compose.yml`, `.env.example`; add `.env` to `.gitignore`
4. `src/lib/router/types.ts` — all shared TypeScript types
5. `src/lib/router/detector.ts` + `detector.test.ts`
6. `src/lib/router/specialists.ts` + `specialists.test.ts` (stub prompts)
7. `src/lib/router/index.ts` (`route(taskType, input, specialists)`) + `router.test.ts`
8. `src/lib/cost/calculator.ts` + `calculator.test.ts`

### Phase 2 — API Route (SSE)
9. `src/pages/api/route.ts` — reads env vars, calls `buildSpecialists`, calls `route(taskType, input, specialists)`, emits SSE; uses `createOpenAI({ baseURL })` for streaming
10. Pull models: `ollama pull phi3.5 && ollama pull qwen2.5-coder:7b`
11. Manual smoke test via curl for all 4 task types

### Phase 3 — UI
12. `src/components/App.tsx` + state + SSE client + cancel + history wiring
13. `src/components/TaskPanel.tsx` + `TaskPanel.test.tsx`
14. `src/components/RoutingPanel.tsx` + `RoutingPanel.test.tsx`
15. `src/components/ResponsePanel.tsx` + `ResponsePanel.test.tsx`
16. `src/components/CostBadge.tsx` + `CostBadge.test.tsx`
16b. `src/components/HistoryPanel.tsx` + `HistoryPanel.test.tsx`
17. `src/pages/index.astro` — mount `<App client:load />`

### Phase 4 — Polish & Demo Readiness
18. Error states: empty input, oversized input, Ollama unreachable
19. Responsive layout + visual polish
20. Verify all 4 task types with realistic code samples
21. `pnpm test` passes, `pnpm type-check` clean
