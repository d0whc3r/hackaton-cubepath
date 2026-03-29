# Streaming y API — SLM Router

## Visión general

El servidor emite respuestas incrementales al cliente usando **Server-Sent Events (SSE)**. El cliente no hace polling; el servidor envía eventos a medida que el modelo genera tokens.

---

## `runStream()` — Núcleo del streaming

`src/lib/api/stream-runner.ts`

```typescript
export async function runStream({
  emit, // SseEmitter — función que envía eventos SSE al cliente
  input, // string — input del usuario
  modelId, // string — ID del modelo Ollama a usar
  ollama, // ReturnType<typeof ollamaClient>
  systemPrompt, // string — prompt de sistema del especialista
  autoContinue, // boolean — activar auto-continuación (default: true)
}: RunStreamOptions): Promise<void>
```

### Flujo interno

```
1. Crear AbortController con timeout de 5 minutos
2. Llamar streamText() del Vercel AI SDK
3. Por cada chunk:
   a. Acumular en createChunkBuffer()
      └── Flushea al recibir newline o ≥5 chars acumulados
   b. emit({ event: 'response_chunk', data: { text: chunk } })
4. Al terminar:
   a. Comprobar si finishReason === 'length' (límite de tokens)
   b. Si autoContinue && outputSize < 50KB:
      └── Enviar segunda petición con último 2KB de contexto
   c. Si no, emit({ event: 'done' })
5. En caso de error: emit({ event: 'error', data: { message } })
```

### Auto-continuación

Cuando el modelo alcanza el límite de tokens (`finishReason === 'length'`):

```typescript
// Segunda petición con contexto recortado
const continuationPrompt = `Continue from where you left off:
...${last2KbOfOutput}`

await runStream({ ...options, input: continuationPrompt, autoContinue: false })
```

- Límite: salida total < 50 KB (evita respuestas descontroladas).
- Contexto: últimos 2 KB de la respuesta previa.
- Solo 1 nivel de continuación (no recursivo).

---

## Cliente Ollama (`sse.ts`)

```typescript
// src/lib/api/sse.ts
import { createOpenAI } from '@ai-sdk/openai'

export function ollamaClient(baseUrl: string) {
  return createOpenAI({
    apiKey: 'ollama', // valor requerido pero ignorado por Ollama
    baseURL: `${baseUrl}/v1`,
  })
}
```

Ollama expone un endpoint `/v1/chat/completions` compatible con la API de OpenAI. El cliente OpenAI del Vercel AI SDK actúa como adaptador directo.

---

## Protocolo SSE

Todos los eventos siguen el formato SSE estándar:

```
event: <nombre>
data: <JSON>

```

### Eventos emitidos

| Evento           | Payload                                                                                | Descripción                       |
| ---------------- | -------------------------------------------------------------------------------------- | --------------------------------- |
| `routing_step`   | `{ step, label, status }`                                                              | Paso del proceso de routing       |
| `response_chunk` | `{ text }`                                                                             | Fragmento de texto generado       |
| `cost`           | `{ inputTokens, outputTokens, specialistCostUsd, largeModelCostUsd, savingsPct, ... }` | Estimación de costes al finalizar |
| `done`           | `{}`                                                                                   | Streaming completado              |
| `error`          | `{ message }`                                                                          | Error durante la generación       |
| `interrupted`    | `{}`                                                                                   | Stream cancelado por el usuario   |

### Ejemplo de sesión SSE completa

```
event: routing_step
data: {"step":"guard_check","label":"Validating input...","status":"active"}

event: routing_step
data: {"step":"guard_check","label":"Input validated","status":"done"}

event: routing_step
data: {"step":"detecting_language","label":"Analyzing code...","status":"active"}

event: routing_step
data: {"step":"detecting_language","label":"TypeScript detected","status":"done"}

event: routing_step
data: {"step":"routing_to_specialist","label":"→ explain (qwen2.5:7b)","status":"active"}

event: routing_step
data: {"step":"routing_to_specialist","label":"→ explain (qwen2.5:7b)","status":"done"}

event: response_chunk
data: {"text":"This function implements a binary search"}

event: response_chunk
data: {"text":" algorithm that finds the index of a target value"}

... (más chunks)

event: cost
data: {"inputTokens":312,"outputTokens":487,"specialistCostUsd":0.0008,"largeModelCostUsd":0.048,"savingsPct":98}

event: done
data: {}
```

---

## `buildStreamCallbacks()` — Adaptadores del cliente

`src/lib/utils/stream-callbacks.ts`

Convierte los eventos SSE en actualizaciones del `chat-store`:

```typescript
export function buildStreamCallbacks(task: TaskType): StreamCallbacks {
  return {
    onRoutingStep: (step) => {
      chat - store.appendRoutingStep(task, step)
    },
    onChunk: (text) => {
      chat -
        store.updateLastAssistant(task, (entry) => ({
          ...entry,
          content: entry.content + text,
          status: 'streaming',
        }))
    },
    onCost: (cost) => {
      chat -
        store.updateLastAssistant(task, (entry) => ({
          ...entry,
          cost,
        }))
    },
    onDone: () => {
      chat - store.markTaskDone(task)
    },
    onError: (message) => {
      chat -
        store.updateLastAssistant(task, (entry) => ({
          ...entry,
          status: 'error',
          errorMessage: message,
        }))
    },
  }
}
```

---

## Resolución de modelo (`resolve-model.ts`)

Antes de llamar al streaming, se resuelve el ID del modelo con fallbacks:

```typescript
export function resolveModel(
  configuredModelId: string,
  taskType: TaskType,
  runtime: ModelRuntime,
): string {
  // 1. Usar el modelo configurado por el usuario
  // 2. Fallback al modelo por defecto del runtime
  // 3. Fallback al modelo small por defecto
}
```

Esto garantiza que siempre haya un modelo válido aunque el usuario no haya configurado uno específico para esa tarea.

---

## Cancelación

El cliente puede cancelar el stream en cualquier momento:

```typescript
// En use-chat-session.ts
const controller = new AbortController()
chat - store.setAbortController(task, controller)

// Al pulsar "Cancel":
controller.abort()
// → el servidor emite event: interrupted
```

El `AbortController` se pasa al `streamText()` del AI SDK, que propaga la señal de cancelación a Ollama.

---

## Timeouts

| Timeout                 | Valor      | Propósito                                    |
| ----------------------- | ---------- | -------------------------------------------- |
| `SPECIALIST_TIMEOUT_MS` | 5 minutos  | Duración máxima de un stream de especialista |
| Guard timeout           | 5 segundos | Tiempo máximo para la validación semántica   |

El timeout del especialista está diseñado para hardware de consumo donde los modelos locales pueden ser lentos.
