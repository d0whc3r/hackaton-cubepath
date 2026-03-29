# Stack Tecnológico — SLM Router

## Resumen

| Capa                | Tecnología                           | Versión         |
| ------------------- | ------------------------------------ | --------------- |
| **Framework web**   | Astro (SSG — generación estática)    | 6.1.1           |
| **UI**              | React 19 (islands)                   | 19.2.4          |
| **Estilos**         | Tailwind CSS 4 + shadcn/ui           | 4.2.2           |
| **SDK de IA**       | Vercel AI SDK                        | 6.0.141         |
| **Proveedor LLM**   | Ollama (API compatible con OpenAI)   | —               |
| **HTTP client**     | wretch                               | 3.0.7           |
| **Estado**          | React Query + `useSyncExternalStore` | 5.95.2          |
| **Validación**      | Zod                                  | 4.3.6           |
| **Tests**           | Vitest + Testing Library + MSW 2.x   | 4.1.2           |
| **Logging**         | LogLayer + Sentry                    | 9.1.0 / 10.46.0 |
| **Lenguaje**        | TypeScript (strict mode)             | 6.0.2           |
| **Package manager** | pnpm                                 | 10.33.0         |

---

## Detalle por capa

### Framework — Astro 6

Astro genera un sitio completamente estático (`output: 'static'`). No existe ningún servidor de aplicación: todas las páginas se producen en tiempo de build y se sirven como HTML/CSS/JS estáticos. La lógica de negocio (RailGuard, enrutamiento, streaming) se ejecuta íntegramente en el navegador del usuario.

- **Modo**: SSG — Static Site Generation (`output: 'static'` en `astro.config.ts`).
- **Integración React**: `@astrojs/react` + directiva `client:only="react"` para hidratar únicamente los componentes interactivos (islands).
- **Rutas dinámicas**: `src/pages/tasks/[task].astro` usa `getStaticPaths()` para generar una página estática por cada tipo de tarea en tiempo de build.
- **Layouts**: `AppLayout.astro`, `TaskPageLayout.astro`, `NonTaskLayout.astro`.

### UI — React 19 + shadcn/ui

- Componentes base de [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitivos + Tailwind).
- Componentes de la aplicación en `src/components/`.
- `next-themes` para gestión de temas (dark mode/light mode).
- `lucide-react` para iconos.
- `sonner` para notificaciones toast.

### Estilos — Tailwind CSS 4

- Tailwind v4 via plugin Vite (`@tailwindcss/vite`).
- `tw-animate-css` para animaciones.
- `class-variance-authority` + `clsx` + `tailwind-merge` para gestión de clases condicionales.

### SDK de IA — Vercel AI SDK

El SDK proporciona la función `streamText()` para streaming de texto desde cualquier proveedor LLM.

```typescript
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const ollama = createOpenAI({
  apiKey: 'ollama',
  baseURL: 'http://localhost:11434/v1',
})

const result = await streamText({
  model: ollama('qwen2.5:1.5b'),
  system: systemPrompt,
  prompt: userInput,
  abortSignal: controller.signal,
})
```

- Ollama expone un endpoint `/v1` compatible con OpenAI.
- El cliente OpenAI del AI SDK actúa como adaptador.

### HTTP — wretch 3

Wrapper moderno de `fetch` con API encadenable y soporte de middlewares.

```typescript
import wretch from 'wretch'

const api = wretch('/api/route').post(payload)
```

### Estado — React Query + chat-store

- **React Query** (`@tanstack/react-query`) gestiona mutaciones y caché de peticiones.
- **chat-store** es un singleton de estado global implementado con el patrón _external store_ de React (`useSyncExternalStore`). Ver [07 — Gestión de estado](./07-gestion-estado.md).

### Validación — Zod 4

Schemas para validar requests y responses de la API:

```typescript
// src/lib/schemas/route.ts
export const RouteRequest = z.object({
  input: z.string().min(1).max(50_000),
  task: TaskType,
  fileName: z.string().optional(),
})
```

### Tests — Vitest + MSW

- **Vitest 4** como runner de tests (compatible con la API de Jest).
- **happy-dom** como simulador de DOM (más ligero que jsdom).
- **MSW 2.x** (Mock Service Worker) intercepta peticiones HTTP en tests.
- **@testing-library/react** para tests de componentes.

### Observabilidad — LogLayer + Sentry

```typescript
// src/lib/observability/client.ts
import { LogLayer } from 'loglayer'
import { SentryTransport } from '@loglayer/transport-sentry'

export const logger = new LogLayer({
  transport: new SentryTransport({ sentry: Sentry }),
  plugins: [redactPlugin], // elimina passwords/tokens de los logs
})
```

- Sentry captura errores y trazas de rendimiento.
- Plugin de redacción elimina datos sensibles antes de enviar.

---

## Herramientas de desarrollo

| Herramienta                   | Propósito                                          |
| ----------------------------- | -------------------------------------------------- |
| `oxlint`                      | Linter rápido en Rust (reemplaza ESLint)           |
| `oxfmt`                       | Formateador de código en Rust                      |
| `husky` + `lint-staged`       | Pre-commit hooks que ejecutan lint + format        |
| `knip`                        | Detección de código y dependencias no usadas       |
| `vite-tsconfig-paths`         | Resolución de path aliases (`@/*`) en Vite         |
| `babel-plugin-react-compiler` | Optimizaciones automáticas del compilador de React |

---

## Docker

El proyecto incluye `Dockerfile` y `docker-compose.yml` para despliegue containerizado.

Como el proyecto es un sitio estático, las variables de entorno se leen en **tiempo de build** y las prefijadas con `PUBLIC_` quedan embebidas en el bundle. Los modelos y la URL de Ollama se pueden sobreescribir en tiempo de ejecución desde `/settings` (persisten en `localStorage`).

Variables de entorno relevantes (build-time):

```env
PUBLIC_OLLAMA_BASE_URL=http://localhost:11434   # URL base de Ollama visible desde el navegador
PUBLIC_SENTRY_DSN=                              # DSN de Sentry (opcional)
PUBLIC_LOG_LEVEL=info                           # Nivel de log del cliente
```
