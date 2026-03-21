# Quickstart: Intelligent SLM Router for Developer Tasks

**Branch**: `001-slm-router-dev-tasks` | **Date**: 2026-03-21

## Prerequisites

- Node.js >= 24 + pnpm 10
- [Ollama](https://ollama.com/download) installed locally **or** Docker Desktop
- Docker + Docker Compose (for containerised local dev)

---

## Option A — Local Dev with Docker Compose (recommended)

Everything runs in containers. Ollama and the app are wired automatically.

### 1. Install dependencies

```bash
pnpm install
pnpm add ai @ai-sdk/openai
pnpm add -D vitest happy-dom @testing-library/react @testing-library/user-event vite-tsconfig-paths
```

### 2. Create `.env` from the example

```bash
cp .env.example .env
```

`.env.example` contains:

```env
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_EXPLAIN_MODEL=phi3.5
OLLAMA_CODE_MODEL=qwen2.5-coder:7b
HOST=0.0.0.0
PORT=4321
```

> `.env` is gitignored — never commit it. For local dev without Docker, change `OLLAMA_BASE_URL` to `http://localhost:11434`.

### 3. Start services

```bash
docker compose up --build
```

This starts:
- `ollama` container on port `11434`
- `app` container on port `4321`

On first run the Ollama container is empty — pull the models (step 4).

### 4. Pull models into Ollama (once per machine)

```bash
# Pull into the running Ollama container
docker compose exec ollama ollama pull phi3.5
docker compose exec ollama ollama pull qwen2.5-coder:7b

# Or the lighter variant if RAM < 8 GB:
docker compose exec ollama ollama pull qwen2.5-coder:3b
```

Models are stored in the `ollama_data` Docker volume and persist across restarts.

### 5. Verify

Open `http://localhost:4321` in your browser.

Smoke test the API directly:

```bash
curl -N -X POST http://localhost:4321/api/route \
  -H "Content-Type: application/json" \
  -d '{"input":"function add(a, b) { return a + b; }","taskType":"explain"}'
```

Expected: a stream of SSE events ending with `event: done`.

---

## Option B — Local Dev without Docker

Run Ollama natively, Astro via `pnpm dev`.

### 1. Install and start Ollama

```bash
# macOS
brew install ollama
ollama serve   # starts on http://localhost:11434

# Linux
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
```

### 2. Pull models

```bash
ollama pull phi3.5
ollama pull qwen2.5-coder:7b
```

### 3. Configure `.env`

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EXPLAIN_MODEL=phi3.5
OLLAMA_CODE_MODEL=qwen2.5-coder:7b
```

### 4. Install dependencies and run

```bash
pnpm install
pnpm add ai @ai-sdk/openai
pnpm dev   # Astro starts on http://localhost:4321
```

---

## Running Tests

Tests run without Ollama (no AI calls in tests):

```bash
pnpm test           # run all tests once
pnpm test:watch     # watch mode
```

Add to `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:

```typescript
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

---

## Lint, Format, Type-check

```bash
pnpm lint          # oxlint
pnpm lint:fix      # oxlint --fix
pnpm format        # oxfmt
pnpm type-check    # astro check
```

---

## Production Deployment

### App VPS

```bash
# Build and push Docker image
docker build -t slm-router-app .
docker push <registry>/slm-router-app

# On the app VPS:
docker run -d \
  -p 4321:4321 \
  -e OLLAMA_BASE_URL=http://<ollama-vps-ip>:11434 \
  -e OLLAMA_EXPLAIN_MODEL=phi3.5 \
  -e OLLAMA_CODE_MODEL=qwen2.5-coder:7b \
  <registry>/slm-router-app
```

### Ollama VPS

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &   # or run as a systemd service

# Pull models
ollama pull phi3.5
ollama pull qwen2.5-coder:7b

# Verify Ollama is reachable
curl http://localhost:11434/api/tags
```

> ⚠️ Port 11434 should only be accessible from the app VPS (firewall rule), not publicly. Ollama has no built-in authentication.

---

## Key Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for the Astro Node standalone app |
| `docker-compose.yml` | Local dev orchestration: app + ollama |
| `.env.example` | Required env vars with defaults |
| `src/pages/api/route.ts` | SSE streaming endpoint |
| `src/lib/router/specialists.ts` | Specialist registry — model IDs read from env |
| `src/lib/router/detector.ts` | Heuristic language detection |
| `src/lib/router/index.ts` | Router: detect → select → build prompt |
| `src/lib/cost/calculator.ts` | Token estimation + cost comparison |
| `src/components/App.tsx` | Root island: state + SSE client |
| `vitest.config.ts` | Vitest + happy-dom configuration |
