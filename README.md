# SLM Router

[![CI](https://github.com/d0whc3r/hackaton-cubepath/actions/workflows/ci.yml/badge.svg)](https://github.com/d0whc3r/hackaton-cubepath/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](./LICENSE)
[![Node >= 24](https://img.shields.io/badge/node-%3E%3D24-1f6feb.svg)](https://nodejs.org/)
[![pnpm 10](https://img.shields.io/badge/pnpm-10-f69220.svg)](https://pnpm.io/)

**Intelligent routing of small language models for developer workflows — 100% local, no cloud required.**

Instead of sending every request to one large model, SLM Router detects what kind of task the user wants to perform and delegates it to a specialized small model (SLM) that is purpose-built and prompt-tuned for that exact task. All inference runs locally via [Ollama](https://ollama.com) — your code never leaves your machine.

---

## How it works

```
User submits code
  → RailGuard validates input (static rules + LLM guard)
    → Analyst detects language & framework
      → Router selects the right specialist model
        → Specialist streams the response in real time
          → UI shows result + cost savings vs cloud providers
```

Every step is visible in real time: the UI shows routing progress, the detected language, the model chosen, and a live cost comparison against GPT-4o, Claude, and other cloud providers.

---

## Supported tasks (10 specialists)

| Task               | Description                                                      |
| ------------------ | ---------------------------------------------------------------- |
| `explain`          | Senior-level explanation of what a piece of code does            |
| `test`             | Unit tests using the detected framework (Vitest, pytest, JUnit…) |
| `refactor`         | Code quality and readability improvements                        |
| `commit`           | Concise, descriptive commit message from a `git diff`            |
| `docstring`        | Documentation comments (JSDoc, Python docstrings, etc.)          |
| `type-hints`       | Type annotations (TypeScript, Python mypy)                       |
| `error-explain`    | Root cause analysis and fix steps for error messages             |
| `performance-hint` | Performance optimization suggestions                             |
| `naming-helper`    | Better names for variables and functions                         |
| `dead-code`        | Detection of unreachable or unused code                          |

Each task has its own specialist model and a dedicated system prompt that injects the detected language, framework, and task context.

---

## Key features

### Task-based routing

The **Analyst** model (`qwen2.5:0.5b` by default) inspects the input and returns structured JSON with the detected language, framework, and whether the input is a `git diff`. This context is injected into the specialist's system prompt to produce much better results (e.g. `test` generates `vitest` tests for a TypeScript project, not generic ones). For tasks that don't need this context (like `commit` or `naming-helper`), the router goes straight to the specialist — no analyst overhead.

### RailGuard — two-layer security

Every request is validated before reaching any model:

1. **Static rules** (`sanitise.ts`) — always active, very fast. Regex-based detection of prompt injection attempts (`ignore previous instructions`, `you are now`…), off-topic input, and code injection patterns (`eval(`, `exec(`, `__import__`…).
2. **Semantic validation** (`semantic-validator.ts`) — a tiny, fast guard model (`qwen2.5:0.5b`) is asked: _"Is this input appropriate for this task? YES or NO."_ The guard is **fail-open**: it only blocks if the answer is an explicit `NO`. Timeouts, ambiguous responses, and connection errors are allowed through — false positives are minimized, and the static layer is the authoritative gate.

A circular in-memory buffer (max 1,000 entries) logs every validation event for debugging and monitoring.

### Real-time streaming

Responses stream token by token from Ollama directly to the browser via the Vercel AI SDK. If the model hits a token limit mid-response, the system **auto-continues** automatically, sending a second request with the last 2 KB of context. Progress steps (guard check, language detection, model selection) are streamed as SSE events so the UI stays live throughout.

### Cost comparison

After each response, the UI shows how much the same request would have cost on GPT-4o, Claude 3.5 Sonnet, and other cloud providers — versus running locally. The `CostBadge` component displays the estimated savings (typically 95–99%) with a per-provider breakdown.

### Translate response

Any response can be translated to the user's language with a single click. The translation preserves code blocks, function names, identifiers, and all programming-related content — only prose is translated.

### Conversation history

Each task page maintains its own conversation history, persisted in IndexedDB (with localStorage fallback). Unread notification badges appear for tasks completed in the background.

---

## Architecture

The entire application runs **100% in the browser** — there is no application server. Ollama is called directly from the client via `fetch` using its OpenAI-compatible API.

```
┌─────────────────────────────────────────────────────────────────┐
│                  Browser — React Islands (client:only)           │
│                                                                  │
│  ChatInput → useChatSession → buildRouteMutationOptions()        │
│                                                                  │
│  1. RailGuard        static rules → semantic LLM guard           │
│  2. Router           analyst LLM → specialist selection          │
│  3. Specialist       runStream() → auto-continue on token limit  │
│                                                                  │
│  chat-store (useSyncExternalStore) + IndexedDB persistence       │
└───────────────────────────────┬─────────────────────────────────┘
                                │ fetch (OpenAI-compatible API)
                                ▼
                    ┌───────────────────────┐
                    │   Ollama local         │
                    │   localhost:11434       │
                    └───────────────────────┘
```

The UI is built with Astro + React Islands: only the interactive parts are hydrated as React components; the rest is static HTML.

---

## Tech stack

- **Astro 6** (SSG, static output)
- **React 19** islands (`client:only`)
- **Tailwind CSS 4** + shadcn/ui
- **Vercel AI SDK** + Ollama provider (OpenAI-compatible)
- **Ollama** for local model serving
- **wretch** for HTTP with middleware
- **Zod** for schema validation
- **Vitest** + Testing Library

---

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Key variables:

| Variable                | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `OLLAMA_BASE_URL`       | Ollama endpoint (default: `http://localhost:11434`) |
| `OLLAMA_EXPLAIN_MODEL`  | Model for the `explain` task                        |
| `OLLAMA_TEST_MODEL`     | Model for the `test` task                           |
| `OLLAMA_REFACTOR_MODEL` | Model for the `refactor` task                       |
| `OLLAMA_COMMIT_MODEL`   | Model for the `commit` task                         |
| `OLLAMA_CODE_MODEL`     | Fallback for any task without a specific model set  |

Model selection can also be managed at runtime from the `/settings` page.

### 3. Pull models and run

```bash
ollama serve
ollama pull qwen2.5:0.5b      # analyst + guard (tiny, fast)
ollama pull qwen2.5-coder:7b  # specialist tasks
ollama pull phi3.5             # alternative specialist
```

```bash
pnpm dev
```

App runs at `http://localhost:4321`.

### 4. Run with Docker Compose

```bash
docker compose up --build
```

---

## Pages

| Route                     | Description                |
| ------------------------- | -------------------------- |
| `/`                       | Overview and task launcher |
| `/tasks/explain`          | Explain code               |
| `/tasks/test`             | Generate tests             |
| `/tasks/refactor`         | Refactor code              |
| `/tasks/commit`           | Write commit message       |
| `/tasks/docstring`        | Add documentation comments |
| `/tasks/type-hints`       | Add type annotations       |
| `/tasks/error-explain`    | Explain errors             |
| `/tasks/performance-hint` | Performance suggestions    |
| `/tasks/naming-helper`    | Naming suggestions         |
| `/tasks/dead-code`        | Dead code detection        |
| `/settings`               | Model configuration        |

---

## Scripts

| Command           | Description                |
| ----------------- | -------------------------- |
| `pnpm dev`        | Start local dev server     |
| `pnpm build`      | Type-check + build         |
| `pnpm preview`    | Preview production build   |
| `pnpm type-check` | Run Astro type diagnostics |
| `pnpm test`       | Run Vitest once            |
| `pnpm test:watch` | Run Vitest in watch mode   |
| `pnpm lint`       | Run oxlint                 |
| `pnpm format`     | Run oxfmt                  |

---

## CI

GitHub Actions runs on push to `main` and on pull requests:

1. Install
2. Build (includes type-check)
3. Test

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

---

## Documentation

Detailed technical docs live in [`docs/explain/`](./docs/explain/):

- [Vision & value proposition](./docs/explain/01-vision-general.md)
- [Architecture](./docs/explain/02-arquitectura.md)
- [Tech stack](./docs/explain/03-tecnologias.md)
- [Project structure](./docs/explain/04-estructura-proyecto.md)
- [Routing system](./docs/explain/05-enrutamiento.md)
- [Streaming & API](./docs/explain/06-streaming-api.md)
- [State management](./docs/explain/07-gestion-estado.md)
- [Security — RailGuard](./docs/explain/08-seguridad.md)
- [Cost calculation](./docs/explain/09-costes.md)
- [Tests](./docs/explain/10-tests.md)
- [Configuration](./docs/explain/11-configuracion.md)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).
