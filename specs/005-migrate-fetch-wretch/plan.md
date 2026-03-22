# Implementation Plan: Migrate fetch to wretch

**Branch**: `005-migrate-fetch-wretch` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-migrate-fetch-wretch/spec.md`

## Summary

Replace all 8 raw `fetch(` call sites with two wretch shared-client instances — one for server-side Ollama calls and one for client-side app API calls — adding `retry()` + `dedupe()` middleware globally. Streaming endpoints use wretch's `.res()` terminal to preserve existing `ReadableStream` handling. MSW 2.x is introduced to provide transport-agnostic test interception. See [research.md](./research.md) for all resolved decisions.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode)
**Primary Dependencies**: wretch (new), wretch-middlewares (new), msw 2.x (new, dev), Astro 6.0.8, React 19, Vitest 4.1.0
**Storage**: N/A
**Testing**: Vitest 4.1.0 + happy-dom + MSW 2.x (msw/node)
**Target Platform**: Cloudflare Workers (via @astrojs/cloudflare) + Node.js >= 24 dev
**Project Type**: Full-stack web application (Astro + React islands, SSR on Cloudflare Workers)
**Performance Goals**: No degradation vs. current; wretch adds ~1.8KB gzipped to client bundle
**Constraints**: Must not leak server-only Ollama base URL into client bundle; streaming responses must remain unbuffered
**Scale/Scope**: 8 call sites across 3 server-side and 5 client-side files

## Constitution Check

The constitution template is unpopulated — no project-specific gates defined. No violations to evaluate.

## Project Structure

### Documentation (this feature)

```text
specs/005-migrate-fetch-wretch/
├── plan.md              ✓ This file
├── research.md          ✓ Phase 0 output
├── data-model.md        N/A — refactor, no new data entities
├── contracts/
│   └── http-clients.md  ✓ Phase 1 output
└── tasks.md             Phase 2 output (/speckit.tasks)
```

### Source Code Changes

```text
src/
├── lib/
│   └── http/                          ← NEW directory
│       ├── ollama-client.ts           ← NEW: server-side wretch instance (Ollama)
│       └── app-client.ts              ← NEW: client-side wretch instance (app API)
│
├── pages/api/ollama/
│   ├── pull.ts                        ← MODIFIED: streaming, use ollamaWretch + .res()
│   ├── models.ts                      ← MODIFIED: non-streaming, use ollamaWretch + .json()
│   └── model.ts                       ← MODIFIED: non-streaming, use ollamaWretch + .json()
│
├── components/
│   ├── chat/
│   │   └── TranslateButton.tsx        ← MODIFIED: streaming, use appWretch + .res()
│   └── model/settings/
│       ├── use-model-pull.ts          ← MODIFIED: streaming, use appWretch + .res()
│       ├── use-installed-models.ts    ← MODIFIED: non-streaming, use appWretch + .json()
│       └── use-runtime-model-details.ts ← MODIFIED: non-streaming, use appWretch + .json()
│
└── lib/services/
    └── route.service.ts               ← MODIFIED: streaming, use appWretch + .res()

src/__tests__/
├── msw/                               ← NEW directory
│   ├── server.ts                      ← NEW: MSW node server setup
│   ├── setup.ts                       ← NEW: Vitest globalSetup (listen/reset/close)
│   └── handlers/
│       ├── ollama.ts                  ← NEW: MSW handlers for Ollama API routes (+ error variants)
│       ├── app.ts                     ← NEW: MSW handlers for app API routes (+ error variants)
│       └── index.ts                   ← NEW: barrel re-exporting combined handler array
│
└── lib/http/
    ├── ollama-client.test.ts          ← NEW: tests for ollamaWretch (retry, dedupe, error handling)
    └── app-client.test.ts             ← NEW: tests for appWretch (retry, dedupe, error handling)
```

**vitest.config.ts**: add `setupFiles: ['src/__tests__/msw/setup.ts']`

## Complexity Tracking

No constitution violations.

---

## Phase 0: Research ✓

Research complete. See [research.md](./research.md). All NEEDS CLARIFICATION resolved:

| Unknown | Resolution |
|---|---|
| Streaming strategy | `.res()` terminal + existing reader code |
| AbortSignal compatibility | `.signal(AbortSignal.timeout(ms))` |
| Retry scope | 5xx + network errors only, max 3 attempts, 500ms base delay |
| Two-client architecture | `ollama-client.ts` (server) + `app-client.ts` (client) |
| Test mocking | MSW 2.x `msw/node`, Vitest setupFiles |
| CF Workers compat | Confirmed: wretch uses Web APIs only |

---

## Phase 1: Design & Contracts

### Shared Client Designs

#### `src/lib/http/ollama-client.ts` — Server-side

```typescript
// Server-side wretch instance targeting the Ollama API.
// Used by: src/pages/api/ollama/{pull,models,model}.ts
//
// Pattern for non-streaming:
//   ollamaWretch.url('/api/tags').signal(AbortSignal.timeout(5000)).get().json<T>()
//
// Pattern for streaming (pull.ts):
//   const res = await ollamaWretch.url('/api/pull')
//     .signal(AbortSignal.timeout(600_000))
//     .post({ name: model, stream: true })
//     .res()
//   // then: res.body.getReader() — unchanged from current code
```

Key configuration:
- Base URL: dynamic (`baseUrl` parameter passed at call site via `.url(baseUrl + path)` or `.options()`)
- Middleware: `retry({ maxAttempts: 3, delayTimer: 500, exponential: true, until: (res) => res != null && res.status < 500 })`, `dedupe()`
- No global `.notFound()` catcher — each caller handles HTTP errors inline (consistent with current behavior)

> **Note on base URL**: The Ollama base URL is dynamic per request (callers pass `baseUrl` from query params or request body). Therefore `ollamaWretch` is created without a fixed base URL; callers extend it with the full endpoint URL. The shared value is middleware + defaults, not base URL.

#### `src/lib/http/app-client.ts` — Client-side

```typescript
// Client-side wretch instance targeting the app's own API routes.
// Used by: src/components/**, src/lib/services/**
//
// Pattern for non-streaming:
//   appWretch.url('/api/ollama/models').query({ baseUrl }).get().json<T>()
//
// Pattern for streaming:
//   const res = await appWretch.url('/api/route').post(body).res()
//   // then: res.body.getReader() — unchanged from current code
```

Key configuration:
- Base URL: none (relative URLs work in browser context)
- Middleware: `retry({ maxAttempts: 3, delayTimer: 500, exponential: true, until: (res) => res != null && res.status < 500 })`, `dedupe()`
- AbortSignal: passed per call via `.signal(abortController.signal)`

### MSW Setup Design

```typescript
// src/__tests__/msw/setup.ts
import { server } from './server'
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

Vitest config addition:
```typescript
setupFiles: ['src/__tests__/msw/setup.ts']
```

Handler pattern (ollama.ts):
```typescript
import { http, HttpResponse } from 'msw'
export const ollamaHandlers = [
  http.get('http://localhost:11434/api/tags', () =>
    HttpResponse.json({ models: [{ name: 'llama3.2:latest' }] })
  ),
  http.post('http://localhost:11434/api/show', () =>
    HttpResponse.json({ capabilities: ['completion'] })
  ),
]
```

### Dependency Changes

| Package | Type | Version | Purpose |
|---|---|---|---|
| `wretch` | prod | `^2.x` | Fetch wrapper |
| `wretch-middlewares` | prod | `^4.x` | retry + dedupe middleware |
| `msw` | dev | `^2.x` | Network-level test mocking |

### Call-by-Call Migration Map

| File | Current pattern | Migrated pattern | Streaming? |
|---|---|---|---|
| `pull.ts` | `fetch(url, { method: 'POST', body, headers, signal })` | `ollamaWretch.url(url).signal(s).post(body).res()` | Yes (.res()) |
| `models.ts` | `fetch(url, { signal })` | `ollamaWretch.url(url).signal(s).get().json<T>()` | No |
| `model.ts` | `Promise.all([fetch(show), fetch(tags)])` | `Promise.all([ollamaWretch…res1, ollamaWretch…res2])` | No |
| `TranslateButton.tsx` | `fetch('/api/translate', { method: 'POST', body, headers, signal })` | `appWretch.url('/api/translate').signal(s).post(body).res()` | Yes (.res()) |
| `use-model-pull.ts` | `fetch('/api/ollama/pull', { method: 'POST', body, headers, signal })` | `appWretch.url('/api/ollama/pull').signal(s).post(body).res()` | Yes (.res()) |
| `use-installed-models.ts` | `fetch(\`/api/ollama/models?baseUrl=…\`, { signal })` | `appWretch.url('/api/ollama/models').query({ baseUrl }).signal(s).get().json<T>()` | No |
| `use-runtime-model-details.ts` | `fetch(\`/api/ollama/model?…\`, { signal })` | `appWretch.url('/api/ollama/model').query({ baseUrl, model }).signal(s).get().json<T>()` | No |
| `route.service.ts` | `fetch('/api/route', { method: 'POST', body, headers, signal })` | `appWretch.url('/api/route').signal(s).post(body).res()` | Yes (.res()) |

### QueryString Addon

`use-installed-models.ts` and `use-runtime-model-details.ts` currently use template literals for query strings. After migration, these callers use wretch's `QueryStringAddon` (`.query({ key: value })`) to avoid manual URL encoding. The `QueryStringAddon` must be applied to `appWretch` at initialization.

```typescript
import wretch from 'wretch'
import QueryStringAddon from 'wretch/addons/queryString'
export const appWretch = wretch().addon(QueryStringAddon).middlewares([...])
```

---

## Agent Context Update

Run after Phase 1 completes:

```bash
.specify/scripts/bash/update-agent-context.sh claude
```

New technology to add:
- `wretch` — fetch wrapper with fluent API
- `wretch-middlewares` — retry + dedupe middleware
- `msw` — MSW 2.x for network-level test mocking in Vitest
