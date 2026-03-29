# Gestión de Estado — SLM Router

## Visión general

El estado se gestiona en dos niveles:

1. **Estado global de conversación** — `chat-store.ts` (singleton, `useSyncExternalStore`)
2. **Configuración de modelos** — `model-config.ts` (localStorage + IndexedDB)

---

## `chat-store.ts` — Estado global de conversación

`src/lib/stores/chat-store.ts`

Singleton que implementa el patrón **external store** de React, compatible con `useSyncExternalStore`.

### Estructura del snapshot

```typescript
type StoreSnapshot = {
  entries: Record<TaskType, ConversationEntry[]> // historial por tarea
  loaded: Record<TaskType, boolean> // ¿se cargó el historial de IDB?
  loading: Record<TaskType, boolean> // ¿hay un stream activo?
  unread: Record<TaskType, boolean> // ¿hay resultado nuevo sin ver?
}
```

### Entradas de conversación

```typescript
interface ConversationEntry {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  status?: 'pending' | 'streaming' | 'done' | 'error' | 'interrupted'
  routingSteps?: RoutingStep[]
  specialistName?: string
  modelId?: string
  cost?: CostEstimate
  errorMessage?: string
}
```

### API del store

```typescript
// Suscripción (useSyncExternalStore)
export function subscribe(listener: () => void): () => void

// Lectura
export function getSnapshot(): StoreSnapshot

// Mutaciones
export function appendEntry(task: TaskType, entry: ConversationEntry): void
export function updateLastAssistant(
  task: TaskType,
  updater: (entry: ConversationEntry) => ConversationEntry,
): void
export function clearTask(task: TaskType): void
export function setLoading(task: TaskType, value: boolean): void
export function markTaskDone(task: TaskType): void // activa indicador no leído
export function markRead(task: TaskType): void

// Cancelación
export function getAbortController(task: TaskType): AbortController | undefined
export function setAbortController(task: TaskType, controller: AbortController): void
```

### Persistencia

- Las entradas se persisten en **IndexedDB** via `getStorageEngine('history')`.
- Al cambiar de tarea, el historial se carga de IDB de forma lazy (solo cuando se visita la tarea).
- Escrituras síncronas en localStorage como write-through para consistencia entre tabs.

### Uso en componentes

```typescript
// En use-chat-session.ts
const snapshot = useSyncExternalStore(chatStore.subscribe, chatStore.getSnapshot)

const entries = snapshot.entries[activeTask] ?? []
const isLoading = snapshot.loading[activeTask] ?? false
```

---

## `model-config.ts` — Configuración de modelos

`src/lib/config/model-config.ts`

### Estructura de configuración

```typescript
interface ModelConfig {
  // Runtime global
  modelRuntime: 'small' | 'local' | 'cloud'

  // Modelos por tarea
  explainModel: string
  testModel: string
  refactorModel: string
  commitModel: string
  docstringModel: string
  typeHintsModel: string
  errorExplainModel: string
  performanceHintModel: string
  namingHelperModel: string
  deadCodeModel: string

  // Modelos de sistema
  analystModel: string
  translateModel: string

  // Conexión
  ollamaBaseUrl: string
}
```

### Estrategia de almacenamiento — diff-based

Solo se persisten los valores que **difieren del default**, reduciendo el tamaño en storage:

```typescript
// Guardar
export async function saveModelConfig(config: ModelConfig): Promise<void> {
  const diff = getDiffFromDefaults(config) // solo campos no-default
  await idb.set('model-config', diff) // IDB (preferido)
  localStorage.setItem('slm-router-model-config', JSON.stringify(diff)) // fallback
}

// Cargar (síncrono, desde localStorage)
export function loadModelConfig(): ModelConfig {
  const stored = localStorage.getItem('slm-router-model-config')
  const diff = stored ? JSON.parse(stored) : {}
  return { ...DEFAULTS, ...diff }
}

// Cargar (async, desde IDB)
export async function loadModelConfigAsync(): Promise<ModelConfig> {
  const diff = (await idb.get('model-config')) ?? {}
  return { ...DEFAULTS, ...diff }
}
```

### Sincronización entre tabs

Cuando se guarda la configuración, se dispara un evento custom:

```typescript
window.dispatchEvent(new CustomEvent('MODEL_CONFIG_UPDATED_EVENT'))
```

Los componentes que necesitan reaccionar a cambios de configuración escuchan este evento.

---

## `getStorageEngine()` — Abstracción de almacenamiento

`src/lib/storage/engine.ts`

Una función que devuelve el backend de almacenamiento correcto según la categoría:

```typescript
type StorageCategory = 'history' | 'config' | 'session'

export function getStorageEngine(category: StorageCategory): StorageEngine {
  switch (category) {
    case 'history':
      return new IndexedDBEngine() // async, grande
    case 'config':
      return new LocalStorageEngine() // sync, pequeño
    case 'session':
      return new SessionStorageEngine() // temporal
  }
}
```

```typescript
interface StorageEngine {
  get<T>(key: string): Promise<T | null> | T | null
  set<T>(key: string, value: T): Promise<void> | void
  delete(key: string): Promise<void> | void
  clear(): Promise<void> | void
}
```

Los llamadores nunca saben qué backend están usando. Si IDB no está disponible (contexto privado, cuota excedida), hace fallback a localStorage.

---

## React Query — Mutaciones

`src/lib/services/route.service.ts`

```typescript
export function buildRouteMutationOptions(task: TaskType): MutationOptions {
  return {
    mutationFn: async ({ input, fileName }) => {
      // 1. Validar con Zod
      const validated = RouteRequest.parse({ input, task, fileName })

      // 2. Obtener config de modelos
      const config = loadModelConfig()

      // 3. Llamar al endpoint SSE
      await streamSseRequest('/api/route', validated, config, buildStreamCallbacks(task))
    },
    retry: 0, // sin reintentos (streaming no es idempotente)
    onError: (error) => logger.error('Route mutation failed', error),
  }
}
```

Configuración global de React Query:

```typescript
new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
})
```

---

## `ChatContext` — Contexto React

`src/lib/context/chat-context.ts`

Wrapper de React Context que distribuye el estado de la sesión a los componentes hijos sin prop-drilling:

```typescript
interface ChatContextValue {
  activeTask: TaskType
  entries: ConversationEntry[]
  isLoading: boolean
  handleSubmit: (input: string) => void
  handleCancel: () => void
  handleClearHistory: () => void
}

export const ChatContext = createContext<ChatContextValue>(null!)
```

Consumido por `ChatMessages`, `ChatInput`, `RoutingPanel`, etc.

---

## Diagrama de flujo de estado

```
Usuario escribe y envía
        │
        ▼
useChatSession.handleSubmit()
        │
        ├──► chat-store.appendEntry(task, userEntry)    → IDB persiste
        │
        ├──► chat-store.setLoading(task, true)
        │
        ├──► buildRouteMutationOptions().mutationFn()
        │         │
        │         ├── SSE: routing_step  ──► store.appendRoutingStep()
        │         ├── SSE: response_chunk ──► store.updateLastAssistant()
        │         ├── SSE: cost           ──► store.updateLastAssistant()
        │         └── SSE: done           ──► store.markTaskDone()
        │                                          │
        │                                          └──► unread[task] = true
        │
        └──► useSyncExternalStore notifica a todos los suscriptores
                  │
                  └──► UI re-renderiza con nuevos datos
```
