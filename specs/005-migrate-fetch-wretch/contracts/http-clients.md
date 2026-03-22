# HTTP Client Contracts

**Feature**: 005-migrate-fetch-wretch | **Date**: 2026-03-22

This document defines the interface contracts for the two shared wretch client instances introduced by this feature.

---

## `ollamaWretch` — Server-side Ollama Client

**File**: `src/lib/http/ollama-client.ts`
**Runtime**: Cloudflare Workers / Node.js (server-side only)
**Consumers**: `src/pages/api/ollama/pull.ts`, `src/pages/api/ollama/models.ts`, `src/pages/api/ollama/model.ts`

### Contract

| Concern | Behavior |
|---|---|
| Base URL | None — callers pass full endpoint URL via `.url(fullUrl)` (Ollama base URL is dynamic per-request) |
| Retry | Network errors + HTTP 5xx → max 3 attempts, 500ms base delay, exponential backoff |
| Deduplication | Identical in-flight requests collapsed |
| Timeout | Per-call via `.signal(AbortSignal.timeout(ms))` |
| Streaming | Use `.res()` terminal; stream body via `response.body.getReader()` |
| Non-streaming | Use `.json<T>()` terminal |
| Error handling | Non-OK responses for non-streaming calls throw `WretchError`; streaming calls check `res.ok` manually after `.res()` |

### Usage Patterns

```typescript
// Non-streaming GET
const data = await ollamaWretch
  .url(`${baseUrl}/api/tags`)
  .signal(AbortSignal.timeout(OLLAMA_TIMEOUT_MS))
  .get()
  .json<OllamaTagsResponse>()

// Non-streaming POST
const data = await ollamaWretch
  .url(`${baseUrl}/api/show`)
  .signal(AbortSignal.timeout(OLLAMA_TIMEOUT_MS))
  .post({ model })
  .json<ShowResponse>()

// Streaming POST
const res = await ollamaWretch
  .url(`${baseUrl}/api/pull`)
  .signal(AbortSignal.timeout(PULL_TIMEOUT_MS))
  .post({ name: model, stream: true })
  .res()
// → res.body.getReader() for manual SSE consumption
```

---

## `appWretch` — Client-side App API Client

**File**: `src/lib/http/app-client.ts`
**Runtime**: Browser (client-side only)
**Consumers**: `src/components/chat/TranslateButton.tsx`, `src/components/model/settings/use-model-pull.ts`, `src/components/model/settings/use-installed-models.ts`, `src/components/model/settings/use-runtime-model-details.ts`, `src/lib/services/route.service.ts`

### Contract

| Concern | Behavior |
|---|---|
| Base URL | None — all paths are relative (e.g., `/api/route`) |
| Addons | `QueryStringAddon` — enables `.query({ key: value })` for URL parameter encoding |
| Retry | Network errors + HTTP 5xx → max 3 attempts, 500ms base delay, exponential backoff |
| Deduplication | Identical in-flight requests collapsed |
| Abort | Per-call via `.signal(abortController.signal)` |
| Streaming | Use `.res()` terminal; stream body via `response.body.getReader()` |
| Non-streaming | Use `.json<T>()` terminal |
| Error handling | Non-OK responses for non-streaming calls throw `WretchError`; streaming calls check `res.ok` manually |

### Usage Patterns

```typescript
// Non-streaming GET with query params
const data = await appWretch
  .url('/api/ollama/models')
  .signal(abortController.signal)
  .query({ baseUrl: encodeURIComponent(ollamaBaseUrl) })
  .get()
  .json<{ models?: string[] }>()

// Streaming POST
const res = await appWretch
  .url('/api/route')
  .signal(signal)
  .post(body)
  .res()
// → res.ok check, then res.body.getReader()

// Streaming POST with manual abort
const res = await appWretch
  .url('/api/ollama/pull')
  .signal(abort.signal)
  .post({ baseUrl, model: modelId })
  .res()
// → res.body.getReader() for SSE line parsing
```

---

## MSW Handler Contract

**File**: `src/__tests__/msw/handlers/`
**Runtime**: Vitest + msw/node (test environment only)

All MSW handlers must mirror the real API surface:

| Handler file | Covers |
|---|---|
| `ollama.ts` | `GET http://localhost:11434/api/tags`, `POST http://localhost:11434/api/show`, `POST http://localhost:11434/api/pull` |
| `app.ts` | `GET /api/ollama/models`, `GET /api/ollama/model`, `POST /api/ollama/pull`, `POST /api/route`, `POST /api/translate` |

Handlers must support:
- Happy path responses (valid JSON)
- Error responses (404, 500) for retry/error-handling tests
- Streaming responses (ReadableStream) for SSE endpoint tests
