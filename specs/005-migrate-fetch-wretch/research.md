# Research: Migrate fetch to wretch

**Branch**: `005-migrate-fetch-wretch` | **Date**: 2026-03-22

## 1. AbortSignal compatibility with wretch

**Decision**: Pass `AbortSignal.timeout(ms)` directly via wretch's `.signal()` method.

**Rationale**: wretch exposes a `.signal(signal: AbortSignal)` method that forwards the signal to the underlying `fetch` call. `AbortSignal.timeout()` returns a plain `AbortSignal`, so passing it to `.signal()` is fully compatible. All three Ollama server-side callers that currently use `AbortSignal.timeout(OLLAMA_TIMEOUT_MS)` can be migrated with `.signal(AbortSignal.timeout(OLLAMA_TIMEOUT_MS))` before the terminal method.

**Alternatives considered**:
- wretch's AbortAddon: exposes `.setTimeout()` and `.abort()` but manages its own `AbortController` internally. Cannot compose with externally supplied `AbortController` instances (needed by client-side callers). Rejected.
- wretch-middlewares `throttlingCache`: includes its own abort handling but is unrelated to per-request timeouts. Rejected.

---

## 2. Streaming responses with wretch (.res() approach)

**Decision**: Use `.res()` terminal method to obtain the raw `Response` object, then consume `response.body.getReader()` as before.

**Rationale**: wretch's default terminal methods (`.json()`, `.text()`) buffer the full response body, making them unsuitable for Server-Sent Events (SSE) streams. `.res()` returns the raw `Response` directly, giving full access to `response.body` (a `ReadableStream<Uint8Array>`). All existing stream-reading code (`getReader()`, `TextDecoder`, line-by-line SSE parsing) remains unchanged after the migration. Non-OK status handling still works because wretch intercepts the response before handing it to `.res()` when error catchers are registered.

**Call sites that need `.res()`**:
- `src/pages/api/ollama/pull.ts` — server-side, streams Ollama pull progress
- `src/components/chat/TranslateButton.tsx` — client-side, streams translation chunks
- `src/components/model/settings/use-model-pull.ts` — client-side, streams pull progress
- `src/lib/services/route.service.ts` — client-side, streams route response

**Alternatives considered**:
- wretch streaming addon (third-party): not officially maintained. Rejected.
- Keeping raw `fetch` only for streaming endpoints: violates FR-001 (all 8 call sites must be migrated). Rejected.

---

## 3. Two-client architecture

**Decision**: Two separate wretch base instances:
- `ollamaWretch` — server-side, base URL from `OLLAMA_BASE_URL_DEFAULT` env var
- `appWretch` — client-side, no base URL (relative paths `/api/...`)

**Rationale**: Server-side Ollama calls target `http://localhost:11434` (or a configurable host), which must never be bundled into client-side code. Client-side calls target the app's own API routes using relative URLs, which only work in browser context. Separating them prevents accidental cross-context usage and allows per-client middleware tuning (e.g., dedupe is more useful client-side where duplicate requests from React re-renders are common).

**File locations**:
- `src/lib/http/ollama-client.ts` — server-side; imported by `src/pages/api/ollama/*`
- `src/lib/http/app-client.ts` — client-side; imported by `src/components/**` and `src/lib/services/`

**Alternatives considered**:
- Single shared client: would hardcode the Ollama base URL into client bundles. Rejected.
- No base URL on either client (all call sites specify full URL): loses centralization benefit. Rejected.

---

## 4. Retry + dedupe middleware (wretch-middlewares)

**Decision**: Apply both `retry()` and `dedupe()` from `wretch-middlewares` on both shared clients with these settings:
- `retry`: `{ maxAttempts: 3, delayTimer: 500, resolveWithLatestResponse: false, retryOnNetworkError: true, until: (fetch, error) => error !== null || !fetch?.ok && fetch?.status >= 500 }`
  - Only retries on network errors and HTTP 5xx. 4xx responses pass through immediately.
- `dedupe`: default settings (deduplicates identical in-flight GET requests by URL+method+body hash)

**Rationale**: Consistent with clarification Q2 and Q4 answers. Retry protects against transient Ollama and app-server failures. Dedupe prevents redundant in-flight requests from React concurrent renders (especially relevant for `useInstalledModels` and `useRuntimeModelDetails`).

**Streaming caveat**: Streaming endpoints use `.res()` and consume the response body as a stream. Retry should NOT be applied when the response body is already being consumed (streaming). Approach: both clients configure retry, but streaming call sites call `.middlewares([])` to opt out of retry, or the retry middleware is configured to only retry on network errors (before a response is received), which is safe since a streaming response won't be retried mid-stream by design.

**Alternatives considered**:
- wretch-middlewares `throttlingCache`: useful for read-heavy non-auth APIs but adds complexity. Deferred.

---

## 5. MSW (Mock Service Worker) for tests

**Decision**: Use MSW 2.x with `msw/node` for Vitest + happy-dom test environment. Set up a shared server in `src/__tests__/msw/server.ts` with route handlers in `src/__tests__/msw/handlers/`.

**Rationale**: MSW intercepts requests at the network level using Node.js `http` interceptors (via `@mswjs/interceptors`), making it transport-agnostic — wretch, fetch, axios all get intercepted without test code changes. This fulfills FR-007a (tests pass after mocking layer migration). MSW v2 supports Vitest natively and integrates with happy-dom without polyfills.

**Setup pattern**:
```ts
// src/__tests__/msw/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)
```
In `vitest.config.ts`: add `setupFiles: ['src/__tests__/msw/setup.ts']` and create setup file that calls `server.listen()` / `server.resetHandlers()` / `server.close()`.

**Alternatives considered**:
- Keep mocking `globalThis.fetch` with `vi.fn()`: works but is tightly coupled to fetch implementation details. Migrating to wretch could subtly change call shapes. Rejected per clarification Q4.
- Wretch instance mocking: replaces wretch module with a mock — too brittle, couples tests to implementation. Rejected.

---

## 6. Cloudflare Workers compatibility

**Decision**: wretch and wretch-middlewares are fully compatible with the Cloudflare Workers runtime used by this project (`@astrojs/cloudflare`).

**Rationale**: wretch uses only standard Web APIs (`fetch`, `Request`, `Response`, `AbortSignal`, `ReadableStream`) with no Node.js-specific imports. wretch-middlewares retry and dedupe use `Promise`, `Map`, and timers (`setTimeout`) — all available in the Workers runtime. The package uses ESM exports which are compatible with Cloudflare's bundler (esbuild).

**Alternatives considered**: None — wretch's design explicitly targets browser/edge environments.

---

## Summary table

| Decision | Choice | Key Constraint |
|---|---|---|
| AbortSignal | `.signal(AbortSignal.timeout(ms))` | Compatible with all runtimes |
| Streaming | `.res()` terminal + existing reader logic | Body consumed once, no retry mid-stream |
| Client architecture | Two clients (ollama + app) | Server URL must not leak to client bundle |
| Retry scope | Network errors + 5xx, max 3 attempts | 4xx not retried |
| Dedupe | Default settings on both clients | Safe for GET; streaming calls opt out |
| Test mocking | MSW 2.x with `msw/node` | Transport-agnostic, Vitest-compatible |
| Edge runtime | Compatible, no polyfills needed | Workers runtime supports Web APIs |
