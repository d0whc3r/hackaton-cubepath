# Seguridad — RailGuard

## Objetivo

RailGuard es la capa de seguridad que valida cada petición de usuario **antes** de que llegue al modelo especialista. Combina dos mecanismos complementarios: reglas estáticas y validación semántica por LLM.

---

## Arquitectura de dos capas

```
Input del usuario
       │
       ▼
┌─────────────────────────────┐
│  Capa 1: sanitise()         │  ← Siempre activa, muy rápida
│  Reglas estáticas (regex)   │
└─────────────┬───────────────┘
              │ ¿OK?
              ▼
┌─────────────────────────────┐
│  Capa 2: validateInputSemantic()  │  ← LLM guard, fail-open
│  Validación semántica via LLM │
└─────────────┬───────────────┘
              │ ¿OK?
              ▼
        Router → Specialist
```

---

## Capa 1: Reglas estáticas (`sanitise.ts`)

Reglas basadas en expresiones regulares que detectan:

- **Prompt injection**: intentos de sobreescribir las instrucciones del sistema.
  - Patrones: `ignore previous instructions`, `you are now`, `new system prompt`…
- **Off-topic**: input que no corresponde al tipo de tarea.
  - Ej: keywords SQL en la tarea `docstring`.
  - Ej: texto plano sin código en la tarea `refactor`.
- **Code injection**: comandos peligrosos en el input.
  - Patrones: `eval(`, `exec(`, `__import__`…

```typescript
interface SanitiseResult {
  allowed: boolean
  reason?: string
  matchedRule?: string
}

export function sanitise(input: string, task: TaskType): SanitiseResult
```

Las reglas son **siempre autoritativas**: si `sanitise` bloquea, el input no pasa aunque el guard semántico lo permita.

---

## Capa 2: Validación semántica (`semantic-validator.ts`)

Usa el modelo guard (`qwen2.5:0.5b` por defecto) para preguntar semánticamente si el input es apropiado para la tarea:

```typescript
interface ValidationResult {
  allowed: boolean
  confidence: 'high' | 'medium' | 'low'
  reason?: string
  vector?: AttackVectorCategory
}

export async function validateInputSemantic(
  input: string,
  task: TaskType,
): Promise<ValidationResult>
```

### Prompt del guard

```
You are a security guard for a code assistant.
Task: ${task}
Is the following input appropriate for this task? Answer ONLY "YES" or "NO".

Input: ${input}
```

### Política fail-open

El guard semántico **permite el paso** en cualquiera de estos casos:

- Timeout (> 5 segundos sin respuesta)
- Modelo guard no disponible
- Respuesta ambigua (no es claramente "NO")
- Error de conexión

Solo bloquea si el modelo responde explícitamente `"NO"`.

**Razón**: minimizar falsos positivos. Las reglas estáticas son la capa de seguridad real; el guard semántico es una capa adicional de detección.

---

## Categorías de vectores de ataque

```typescript
type AttackVectorCategory =
  | 'prompt_injection' // Intentos de manipular el prompt de sistema
  | 'jailbreak' // Intentos de eludir restricciones
  | 'off_topic' // Input no relacionado con la tarea
  | 'code_injection' // Código malicioso en el input
  | 'data_exfiltration' // Intentos de extraer información
  | 'pii_exposure' // Datos personales no apropiados
```

---

## Modelos del guard (`guard-models.ts`)

```typescript
interface GuardModelConfig {
  modelId: string // ej: 'qwen2.5:0.5b'
  maxOutputTokens: number // máximo 10 tokens (solo "YES" o "NO")
  timeoutMs: number // 5000 ms
}
```

Los modelos guard son pequeños y rápidos (0.5b parámetros) para no añadir latencia perceptible.

---

## Log de eventos (`event-log.ts`)

Un **buffer circular en memoria** (máximo 1.000 entradas) registra todos los eventos de validación:

```typescript
interface ValidationEvent {
  id: string
  timestamp: number
  task: TaskType
  inputHash: string // hash del input (no el input completo)
  decision: 'allowed' | 'blocked'
  layer: 'static' | 'semantic'
  matchedRule?: string
  vector?: AttackVectorCategory
  latencyMs: number
}

export function logEvent(event: ValidationEvent): void
export function getEvents(): ValidationEvent[]
export function getMetrics(): ValidationMetrics
```

```typescript
interface ValidationMetrics {
  total: number
  allowed: number
  blocked: number
  blockRate: number
  avgLatencyMs: number
  byTask: Record<TaskType, { allowed: number; blocked: number }>
  byVector: Record<AttackVectorCategory, number>
}
```

- No persiste en disco: se pierde al reiniciar el servidor.
- Disponible para debugging y monitoring en tiempo de desarrollo.

---

## `GuardGate` — Componente de bloqueo de UI

`src/components/AppProviders.tsx`

Bloquea el acceso a las páginas de tareas hasta que el modelo guard esté descargado y listo:

```typescript
function GuardGate({ children }: { children: ReactNode }) {
  const { isReady, progress } = useGuardBootstrap()

  if (!isReady) {
    return <GuardBootstrapProgress progress={progress} />
  }

  return <>{children}</>
}
```

`useGuardBootstrap` inicia la descarga del modelo guard al arrancar la app. La página de Settings está exenta de este bloqueo.

---

## Flujo completo de validación

```
1. Input del usuario → sanitise(input, task)
   ├── Bloqueado: respuesta inmediata con error 400
   └── Permitido: continúa

2. → validateInputSemantic(input, task)
   ├── Guard responde "NO" (confianza alta): error 400
   ├── Timeout / error / ambigüedad: PERMITIDO (fail-open)
   └── Guard responde "YES": continúa

3. → Router → Specialist → runStream()

4. En paralelo: logEvent() registra la decisión en el buffer circular
```
