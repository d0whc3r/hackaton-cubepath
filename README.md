# SLM Router

[![CI](https://github.com/d0whc3r/hackaton-cubepath/actions/workflows/ci.yml/badge.svg)](https://github.com/d0whc3r/hackaton-cubepath/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](./LICENSE)
[![Node >= 24](https://img.shields.io/badge/node-%3E%3D24-1f6feb.svg)](https://nodejs.org/)
[![pnpm 10](https://img.shields.io/badge/pnpm-10-f69220.svg)](https://pnpm.io/)

Task-focused SLM router for developer workflows.

This project routes requests to small specialized models based on task type:

- `Explain`
- `Generate Tests`
- `Refactor`
- `Write Commit`

It streams routing and output in real time and shows an estimated cost comparison.

## Why this project

- Demonstrates practical SLM routing for dev tasks.
- Keeps output quality high while reducing model cost.
- Uses a clear, visual UI for demo and product communication.

## Tech stack

- Astro 6 (SSR, Node adapter)
- React 19 islands
- Tailwind CSS 4 + shadcn/ui
- Vercel AI SDK + OpenAI-compatible provider
- Ollama for local/VPS model serving
- Vitest + Testing Library

## Project structure

```text
src/
  components/        # React UI and task workspace
  layouts/           # Astro layout with shared menu/chrome
  pages/             # Astro routes + API endpoint
  lib/               # router, cost, types
  __tests__/         # component + unit tests
```

## Getting started

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment

```bash
cp .env.example .env
```

Default important variables:

- `OLLAMA_BASE_URL`
- `OLLAMA_EXPLAIN_MODEL`
- `OLLAMA_TEST_MODEL`
- `OLLAMA_REFACTOR_MODEL`
- `OLLAMA_COMMIT_MODEL`

Optional fallback for legacy setups:

- `OLLAMA_CODE_MODEL` (used only if the task-specific model variable is not set)
- `HOST`
- `PORT`

### 3) Run with local Ollama

Start Ollama and pull models:

```bash
ollama serve
ollama pull phi3.5
ollama pull qwen2.5-coder:7b
```

Then run app:

```bash
pnpm dev
```

### 4) Run with Docker Compose

```bash
docker compose up --build
```

App runs at `http://localhost:4321`.

## Available pages

- `/` overview
- `/tasks/explain`
- `/tasks/test`
- `/tasks/refactor`
- `/tasks/commit`

## Scripts

- `pnpm dev` run local dev server
- `pnpm build` run type-check + build
- `pnpm preview` preview build
- `pnpm type-check` Astro type diagnostics
- `pnpm test` run Vitest once
- `pnpm test:watch` run Vitest in watch mode
- `pnpm lint` run oxlint
- `pnpm format` run oxfmt

## CI

GitHub Actions workflow runs on:

- push to `main`
- pull requests targeting `main`

It executes:

1. install
2. build
3. test

See `.github/workflows/ci.yml`.

## Documentation

Detailed project docs live in [`docs/`](./docs):

- product scope
- architecture
- implementation plan
- decision log

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).
