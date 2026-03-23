# hackaton-cubepath Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-23

## Active Technologies

- TypeScript 5.9.3 (strict mode) + Astro 6.0.8, React 19, wretch 3.0.7, ai SDK 6.0.134 (Ollama provider), Zod, Vitest 4.1.0 (007-railguard-security)
- In-memory circular buffer (max 1,000 entries) for `ValidationEvent` log; no persistent store (007-railguard-security)

- TypeScript 5.9.3 (strict mode) + Astro 6.0.8, React 19, wretch, ai SDK (Ollama provider), Zod, Vitest 4.1.0 (006-expand-ai-tasks-settings)
- Browser `localStorage` (key: `slm-router-model-config`) (006-expand-ai-tasks-settings)

- TypeScript 5.9.3 (strict mode) + wretch (new), wretch-middlewares (new), msw 2.x (new, dev), Astro 6.0.8, React 19, Vitest 4.1.0 (005-migrate-fetch-wretch)

- TypeScript 5.9.3 (strict mode) + React 19+, Vitest + happy-dom (testing) (003-storage-hook-attempt)
- Browser localStorage / sessionStorage (Web Storage API) (003-storage-hook-attempt)
- TypeScript 5.9.3 (strict mode) + Vitest (testing), AI SDK (`ai` package) (004-prompt-refinement)

- TypeScript 5.9.3 (strict mode) (002-code-quality-refactor)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.9.3 (strict mode): Follow standard conventions

## Recent Changes

- 007-railguard-security: Added TypeScript 5.9.3 (strict mode) + Astro 6.0.8, React 19, wretch 3.0.7, ai SDK 6.0.134 (Ollama provider), Zod, Vitest 4.1.0

- 006-expand-ai-tasks-settings: Added TypeScript 5.9.3 (strict mode) + Astro 6.0.8, React 19, wretch, ai SDK (Ollama provider), Zod, Vitest 4.1.0

- 005-migrate-fetch-wretch: Added TypeScript 5.9.3 (strict mode) + wretch (new), wretch-middlewares (new), msw 2.x (new, dev), Astro 6.0.8, React 19, Vitest 4.1.0

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
