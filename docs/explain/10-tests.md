# Tests — SLM Router

## Stack de testing

| Herramienta                | Versión | Propósito                                       |
| -------------------------- | ------- | ----------------------------------------------- |
| **Vitest**                 | 4.1.2   | Runner de tests (compatible con API Jest)       |
| **happy-dom**              | —       | Simulador de DOM (más ligero que jsdom)         |
| **@testing-library/react** | —       | Tests de componentes React                      |
| **MSW 2.x**                | —       | Mock Service Worker: intercepta peticiones HTTP |
| **@vitest/coverage-v8**    | —       | Cobertura de código                             |

---

## Configuración (`vitest.config.ts`)

```typescript
export default defineConfig({
  environment: 'happy-dom', // DOM simulado para tests de componentes
  globals: true, // test(), expect(), vi, etc. globales
  include: ['src/**/*.test.{ts,tsx}'],
  setupFiles: [
    'src/__tests__/msw/setup.ts', // arranca servidor MSW
    'src/__tests__/setup.ts', // setup global (mocks, polyfills)
  ],
  coverage: {
    provider: 'v8',
    exclude: ['src/**/*.test.{ts,tsx}', 'src/__tests__/**'],
  },
})
```

---

## Mock Service Worker (MSW)

`src/__tests__/msw/`

MSW intercepta peticiones HTTP **en tiempo de test** sin necesidad de un servidor real ni de Ollama.

### Setup

```typescript
// src/__tests__/msw/setup.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Handlers de ejemplo

```typescript
// src/__tests__/msw/handlers/route.ts
import { http, HttpResponse } from 'msw'

export const routeHandlers = [
  http.post('/api/route', () => {
    // Simula respuesta SSE
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('event: routing_step\ndata: {...}\n\n')
        controller.enqueue('event: response_chunk\ndata: {"text":"Hello"}\n\n')
        controller.enqueue('event: done\ndata: {}\n\n')
        controller.close()
      },
    })

    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }),
]
```

---

## Organización de tests

```
src/__tests__/
├── hooks/
│   ├── use-chat-session.test.ts
│   ├── use-storage.test.ts
│   ├── use-ollama-health.test.ts
│   └── use-guard-bootstrap.test.ts
│
├── lib/
│   ├── router/
│   │   ├── detector.test.ts        # Tests de detección de lenguaje por regex
│   │   ├── analyst.test.ts         # Tests del analista LLM
│   │   └── specialists.test.ts     # Tests de configuración de especialistas
│   │
│   ├── api/
│   │   ├── stream-runner.test.ts   # Tests del streaming con timeout y auto-continuación
│   │   ├── sse.test.ts             # Tests del cliente SSE
│   │   └── resolve-model.test.ts   # Tests de resolución de modelo con fallbacks
│   │
│   ├── storage/
│   │   └── engine.test.ts          # Tests de la abstracción de storage
│   │
│   ├── cost/
│   │   └── calculator.test.ts      # Tests del cálculo de costes
│   │
│   ├── railguard/
│   │   ├── sanitise.test.ts        # Tests de reglas estáticas
│   │   ├── semantic-validator.test.ts  # Tests del guard semántico
│   │   └── event-log.test.ts       # Tests del buffer circular
│   │
│   └── model-config.test.ts        # Tests de carga/guardado de configuración
│
├── components/
│   ├── ChatMessages.test.tsx
│   ├── CostBadge.test.tsx
│   └── AppSidebar.test.tsx
│
├── msw/
│   ├── handlers/
│   │   ├── route.ts                # Handler de /api/route (SSE streaming)
│   │   └── ollama.ts               # Handler de API Ollama
│   └── setup.ts
│
└── setup.ts                        # Setup global: mocks de localStorage, IndexedDB, etc.
```

---

## Patrones de test

### Test de hook con React Testing Library

```typescript
// use-chat-session.test.ts
import { renderHook, act } from '@testing-library/react'
import { useChatSession } from '@/hooks/use-chat-session'

test('handleSubmit adds user entry and starts loading', async () => {
  const { result } = renderHook(() => useChatSession('explain'))

  act(() => {
    result.current.handleSubmit('function foo() {}', 'explain')
  })

  expect(result.current.isLoading).toBe(true)
  expect(result.current.entries).toHaveLength(1)
  expect(result.current.entries[0].role).toBe('user')
})
```

### Test de utilidad pura

```typescript
// calculator.test.ts
import { estimateCost } from '@/lib/cost/calculator'

test('calculates savings vs cloud providers', () => {
  const result = estimateCost(1000, 500)

  expect(result.inputTokens).toBe(250) // 1000 / 4
  expect(result.outputTokens).toBe(125) // 500 / 4
  expect(result.savingsPct).toBeGreaterThan(90)
  expect(result.providerComparisons.length).toBeGreaterThan(0)
})
```

### Test de validación de seguridad

```typescript
// sanitise.test.ts
import { sanitise } from '@/lib/railguard/sanitise'

test('blocks prompt injection attempts', () => {
  const result = sanitise('ignore previous instructions and...', 'explain')
  expect(result.allowed).toBe(false)
  expect(result.matchedRule).toContain('prompt_injection')
})

test('allows valid code input', () => {
  const result = sanitise('function add(a: number, b: number) { return a + b }', 'explain')
  expect(result.allowed).toBe(true)
})
```

### Test de detector de lenguaje

```typescript
// detector.test.ts
import { detectLanguage } from '@/lib/router/detector'

test('detects TypeScript with high confidence', () => {
  const code = `
    interface User { id: number; name: string }
    const greet = (user: User): string => \`Hello, \${user.name}\`
  `
  const result = detectLanguage(code)
  expect(result.language).toBe('typescript')
  expect(result.confidence).toBe('high')
})
```

---

## Comandos de test

```bash
# Ejecutar todos los tests
npm test

# Ejecutar con coverage
npm run test:coverage

# Ejecutar en modo watch
npm run test:watch

# Ejecutar un fichero específico
npx vitest run src/__tests__/lib/cost/calculator.test.ts
```

---

## Mocks de entorno

El setup global (`src/__tests__/setup.ts`) proporciona mocks para:

- **localStorage** / **sessionStorage**: objetos en memoria para tests.
- **IndexedDB**: mock de idb para tests de storage.
- **fetch**: interceptado por MSW.
- **AbortController**: implementación estándar de happy-dom.
- **ReadableStream**: para tests de SSE.
