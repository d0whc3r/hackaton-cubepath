# Research: Intelligent SLM Router for Developer Tasks

**Branch**: `001-slm-router-dev-tasks` | **Date**: 2026-03-21

## Existing Project Context

The project is an Astro 6 SSR application configured with the **Node standalone adapter** (`astro.config.ts` already sets `adapter: node({ mode: 'standalone' })`). The Cloudflare adapter is commented out. This means the app builds to `dist/server/entry.mjs` and runs as a standard Node.js server — ideal for Docker deployment.

Already installed:
- **React 19** via `@astrojs/react`
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **shadcn/ui + Radix UI** component primitives
- **TypeScript 5.9**
- **pnpm 10**, **oxlint + oxfmt**, **husky + lint-staged**

Existing source is minimal — clean starter ready to build on.

## AI Runtime: Ollama

**Ollama** runs small language models locally (and on a VPS) and exposes an **OpenAI-compatible HTTP API** at port `11434`. This means:
- No cloud AI API keys required
- Models run fully under our control (local for dev, VPS for prod)
- Swap models by changing the model name string — no code changes
- Works with the Vercel AI SDK via `@ai-sdk/openai` and a custom `baseURL`

### Ollama API compatibility

Ollama implements the OpenAI Chat Completions API at `/v1/chat/completions`, including streaming. The Vercel AI SDK's `createOpenAI({ baseURL })` adapter connects directly:

```typescript
import { createOpenAI } from "@ai-sdk/openai";

const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL + "/v1",  // http://localhost:11434/v1
  apiKey: "ollama",  // required by SDK type; Ollama ignores it
});
```

**Packages to add**: `ai` + `@ai-sdk/openai` (replaces `workers-ai-provider`).

## Model Selection

### Explanation Specialist — `phi3.5`

| Property | Value |
|---|---|
| Ollama tag | `phi3.5` |
| Parameters | 3.8B |
| RAM (Q4_K_M) | ~2.5 GB |
| HuggingFace | [microsoft/Phi-3.5-mini-instruct](https://huggingface.co/microsoft/Phi-3.5-mini-instruct) |
| Context window | 128K tokens |

**Why**: Microsoft's Phi-3.5-mini-instruct is state-of-the-art for its size on instruction-following and reasoning benchmarks. It outperforms many 7B models on natural language tasks while staying under 3 GB in Q4. Ideal for code explanation where the output must be clear prose, not code. Fast on CPU.

### Code Specialist (test / refactor / commit) — `qwen2.5-coder:7b`

| Property | Value |
|---|---|
| Ollama tag | `qwen2.5-coder:7b` |
| Parameters | 7B |
| RAM (Q4_K_M) | ~4.7 GB |
| HuggingFace | [Qwen/Qwen2.5-Coder-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct) |
| Context window | 128K tokens |
| HumanEval score | **76.0%** (best sub-8B as of early 2026) |

**Why**: Qwen2.5-Coder-7B-Instruct is the top-ranked small code model for generation and transformation. Its 76% HumanEval score exceeds models twice its size. It handles test generation, refactoring, and commit messages equally well — demonstrated through different system prompts (the SLM-MUX concept). Supports 40+ programming languages.

### Lighter alternative (VPS < 8 GB RAM)

Replace `qwen2.5-coder:7b` with `qwen2.5-coder:3b` (~2.3 GB Q4). Lower output quality but runs on any basic VPS alongside `phi3.5`, keeping total RAM under 5 GB.

### VPS sizing

| Config | Models in memory | Total RAM | Notes |
|---|---|---|---|
| Standard | phi3.5 + qwen2.5-coder:7b | ~7.5 GB | 8–16 GB VPS, no GPU |
| Lightweight | phi3.5 + qwen2.5-coder:3b | ~4.8 GB | 8 GB VPS, any hardware |

Both models are loaded on first request and kept in memory by Ollama — subsequent requests are much faster (no cold load).

## Deployment Architecture

### Local development

`docker-compose.yml` orchestrates two services:

```
app (Astro :4321) → ollama (Ollama :11434)
                       └─ phi3.5
                       └─ qwen2.5-coder:7b
```

Models are stored in a named Docker volume (`ollama_data`) and persist across container restarts. Pull once, run indefinitely.

### Production

Two separate VPS instances (or one VPS if RAM allows):
- **App VPS**: Runs the Dockerised Astro app; `OLLAMA_BASE_URL` points to the Ollama VPS IP
- **Ollama VPS**: Runs `ollama/ollama` Docker image; port `11434` accessible from the app VPS (private network preferred; avoid exposing publicly without auth)

The app makes standard HTTP calls to `OLLAMA_BASE_URL/v1/chat/completions` — no special networking beyond basic IP reachability.

## Testing: Vitest + happy-dom

**Vitest** configured with **happy-dom** as the DOM environment. `@testing-library/react` for component assertions. No snapshot tests, no E2E.

Key constraint: Ollama is **never called in tests**. Specialist and router functions are pure TypeScript — tested with plain inputs/outputs. No mocking of the AI SDK required.

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "happy-dom",
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
  },
});
```

## Routing Logic

Content-aware routing in this scope:

1. **Task type** (user selection) → primary specialist lookup (deterministic)
2. **Language detection** → enriches the system prompt with language context
3. **Commit input heuristic** → `diff --git` or `@@` in input → diff mode prompt; otherwise description mode

No ML classifier. No dynamic model switching. The "intelligence" is in the system prompt construction.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Ollama cold start on first request | Pull models before starting app; Ollama keeps models in memory after first load |
| Ollama VPS unreachable from app | Add health check in app startup; surface clear error to user via SSE `error` event |
| CPU inference too slow (7B model) | SSE streams routing steps immediately — user sees activity within 200ms; use 3B fallback if needed |
| `phi3.5` Ollama tag changes | Pin exact tag in env var; document in `.env.example` |
| Cost estimates inaccurate for Ollama | Label all figures "estimated — local model pricing"; baseline against equivalent cloud model |
| Vitest + happy-dom incompatibility with Astro aliases | Add `resolve.alias` in `vitest.config.ts` to mirror `tsconfig.json` paths |
