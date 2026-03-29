# Estructura del Proyecto — SLM Router

## Árbol de directorios principal

```
hackaton-cubepath/
├── src/
│   ├── components/         # Componentes React (islands)
│   ├── hooks/              # React hooks personalizados
│   ├── lib/                # Lógica de negocio y utilidades
│   ├── layouts/            # Layouts Astro
│   ├── pages/              # Páginas Astro (router del servidor)
│   ├── data/               # Datos estáticos (metadatos de tareas)
│   └── __tests__/          # Tests unitarios e integración
├── docs/                   # Documentación
├── public/                 # Assets estáticos
├── Dockerfile
├── docker-compose.yml
├── astro.config.ts
├── tsconfig.base.json
├── tsconfig.app.json
├── vitest.config.ts
├── package.json
└── pnpm-workspace.yaml
```

---

## `src/components/` — Componentes React

```
components/
├── chat/
│   ├── TaskApp.tsx              # Island principal: providers + sidebar + chat
│   ├── ChatContainer.tsx        # Contexto de chat + mensajes + input
│   ├── ChatMessages.tsx         # Lista de entradas de conversación
│   ├── AssistantBubble.tsx      # Burbuja de respuesta del modelo
│   ├── UserBubble.tsx           # Burbuja del mensaje del usuario
│   ├── ChatInput.tsx            # Textarea + botón de envío + adjuntos
│   └── ErrorExplainComposer.tsx # Compositor especial para tarea error-explain
│
├── layout/
│   ├── AppSidebar.tsx           # Navegación lateral: tareas + badges de no leídos
│   ├── ThemeToggle.tsx          # Selector dark/light mode
│   └── OllamaStatusBadge.tsx    # Indicador de conectividad con Ollama
│
├── model/
│   ├── ModelConfigPage.tsx      # Página de configuración de modelos
│   ├── SettingsApp.tsx          # Island de ajustes
│   └── TaskRow.tsx              # Fila de configuración por tarea
│
├── markdown/
│   └── MarkdownRenderer.tsx     # react-markdown + rehype-highlight + remark-gfm
│
├── cost/
│   └── CostBadge.tsx            # Muestra ahorro estimado vs cloud
│
├── ui/                          # Componentes base shadcn/ui (Button, Input, etc.)
│
├── AppProviders.tsx             # QueryClient + GuardGate + TooltipProvider
├── TaskPanel.tsx                # Panel de selección de tarea activa
├── HistoryPanel.tsx             # Panel de historial de conversación
├── RoutingPanel.tsx             # Panel de pasos de enrutamiento en vivo
└── ResponsePanel.tsx            # Panel de respuesta del especialista
```

### Componente central: `TaskApp.tsx`

```tsx
// Island principal. Se hidrata en cliente.
export default function TaskApp({ task }: { task: TaskType }) {
  return (
    <AppProviders>
      <AppSidebar />
      <ChatContainer task={task} />
    </AppProviders>
  )
}
```

- `AppProviders` configura `QueryClient`, `GuardGate` (bloquea hasta que el guard esté listo) y `TooltipProvider`.
- `AppSidebar` renderiza la navegación de tareas con indicadores de no leídos.
- `ChatContainer` consume el `ChatContext` y renderiza mensajes + input.

---

## `src/hooks/` — Hooks personalizados

| Hook                     | Propósito                                                    |
| ------------------------ | ------------------------------------------------------------ |
| `use-chat-session.ts`    | Orquestador principal: estado, historial, envío, cancelación |
| `use-chat-input.ts`      | Estado del campo de texto y envío                            |
| `use-file-attachment.ts` | Gestión de adjuntos de fichero                               |
| `use-model-pull.ts`      | Progreso de descarga de modelos Ollama                       |
| `use-ollama-health.ts`   | Comprobación de conectividad con Ollama                      |
| `use-storage.ts`         | Acceso al storage del navegador (localStorage / IDB)         |
| `use-submit-shortcut.ts` | Atajos de teclado para enviar                                |
| `use-guard-bootstrap.ts` | Inicialización del modelo de seguridad al arrancar           |

### Hook central: `use-chat-session.ts`

```typescript
interface UseChatSessionReturn {
  activeTask: TaskType
  currentModel: string
  entries: ConversationEntry[]
  handleCancel: () => void
  handleClearHistory: () => void
  handleSubmit: (input: string, task: TaskType, fileName?: string) => void
  hasPersistedHistory: boolean
  isHydrated: boolean
  isLoading: boolean
  setActiveTask: (task: TaskType) => void
}
```

- Usa `useSyncExternalStore` para suscribirse al `chat-store` global.
- Gestiona `AbortController` por tarea para poder cancelar streams.
- Llama a `buildRouteMutationOptions()` para ejecutar la petición al router.

---

## `src/lib/` — Lógica de negocio

```
lib/
├── router/                   # Sistema de enrutamiento
│   ├── index.ts              # route() y routeWithAnalyst()
│   ├── specialists.ts        # Configuración de especialistas
│   ├── detector.ts           # Detección de lenguaje por regex
│   ├── analyst.ts            # Detección de lenguaje por LLM
│   ├── direct.ts             # Enrutamiento directo (sin analista)
│   ├── types.ts              # TaskType, RoutingDecision, SpecialistConfig
│   ├── models/               # Definiciones de modelos por runtime
│   │   ├── small.ts          # Modelos SLM locales
│   │   ├── cloud.ts          # Modelos cloud
│   │   ├── shared.ts         # Modelos compartidos
│   │   ├── analyst.ts        # Modelo analista
│   │   ├── explain.ts / test.ts / refactor.ts / ...  # Por tarea
│   │   └── index.ts          # Re-exports + defaults por runtime
│   ├── sse-emitters.ts       # Helpers para emitir eventos SSE
│   └── ollama-defaults.ts    # URLs y configuración por defecto de Ollama
│
├── api/                      # HTTP y streaming
│   ├── stream-runner.ts      # runStream(): timeout + auto-continuación
│   ├── sse.ts                # Creación de stream SSE + adaptador ollamaClient()
│   └── resolve-model.ts      # Resolución de model ID con fallbacks
│
├── services/
│   └── route.service.ts      # buildRouteMutationOptions(): valida + llama al router
│
├── schemas/
│   └── route.ts              # Schemas Zod: RouteRequest, AssistantMessage, TaskType
│
├── config/
│   └── model-config.ts       # Config de modelos (IDB + localStorage, diff-based save)
│
├── cost/
│   ├── calculator.ts         # estimateCost(inputChars, outputChars)
│   └── pricing.ts            # Datos de precios por proveedor cloud
│
├── storage/
│   ├── engine.ts             # Abstracción transparente de storage
│   ├── idb.ts                # Operaciones IndexedDB
│   └── (utils/storage.ts)    # Helpers síncronos de localStorage
│
├── stores/
│   └── chat-store.ts         # Singleton de estado global (useSyncExternalStore)
│
├── prompts/                  # Constructores de prompts de sistema
│   ├── explain.ts / test.ts / refactor.ts / commit.ts
│   ├── dead-code.ts / docstring.ts / error-explain.ts / type-hints.ts
│   ├── naming-helper.ts / performance-hint.ts / analyst.ts
│   └── shared.ts
│
├── railguard/                # Capa de seguridad
│   ├── index.ts
│   ├── semantic-validator.ts # Validación semántica via LLM
│   ├── sanitise.ts           # Reglas estáticas (regex)
│   ├── guard-models.ts       # Modelos de guard
│   ├── guard-prompts.ts      # Prompts del guard por tarea
│   ├── event-log.ts          # Buffer circular de eventos de validación
│   └── types.ts              # ValidationResult, AttackVectorCategory
│
├── observability/
│   ├── client.ts             # LogLayer + Sentry transport
│   ├── metrics.ts            # Grabación de métricas de streaming
│   ├── redact.ts             # Plugin de redacción de datos sensibles
│   └── types.ts
│
├── context/
│   └── chat-context.ts       # React Context para el estado de la sesión
│
├── utils/
│   ├── stream-callbacks.ts   # Adaptan eventos SSE → actualizaciones del store
│   ├── history.ts            # Persistencia de historial (async/sync)
│   ├── storage.ts            # Helpers de localStorage/sessionStorage
│   ├── sse.ts                # Tipos de callbacks SSE
│   ├── format.ts             # Formateo de texto
│   ├── attempt.ts            # Helper de try/catch tipado
│   └── savings.ts            # Cálculo de ahorro en costes
│
└── query/
    └── ollama.ts             # Helpers de query a la API de Ollama
```

---

## `src/pages/` — Páginas Astro

```
pages/
├── index.astro               # Homepage con resumen de tareas disponibles
├── tasks/[task].astro        # Página dinámica por tarea (explain, test, etc.)
└── settings.astro            # Configuración de modelos por tarea
```

La ruta `tasks/[task].astro` importa `TaskApp.tsx` como island React:

```astro
---
import TaskApp from '@/components/chat/TaskApp'
const { task } = Astro.params
---
<TaskPageLayout>
  <TaskApp client:load task={task} />
</TaskPageLayout>
```

---

## `src/__tests__/` — Tests

```
__tests__/
├── hooks/                    # Tests de hooks (useChatSession, useStorage, etc.)
├── lib/                      # Tests de servicios y utilidades
│   ├── api/                  # stream-runner, sse, resolve-model
│   ├── storage/              # storage engine
│   └── ...                   # router, cost, model-config, railguard
├── components/               # Tests de componentes React
├── msw/
│   ├── handlers/             # Handlers MSW por endpoint
│   └── setup.ts              # Configuración del servidor MSW
└── setup.ts                  # Setup global de tests (happy-dom, etc.)
```

---

## `src/data/` — Datos estáticos

```typescript
// src/data/task-pages.ts
export const TASK_PAGES = [
  {
    slug: 'explain',
    label: 'Explain Code',
    description: 'Understand what code does',
    icon: BookOpen,
  },
  // ... 9 tareas más
]
```

Usado por `AppSidebar` y la homepage para renderizar la navegación.
