# Sistema de Enrutamiento — SLM Router

## Objetivo

El router decide qué modelo especializado y qué prompt de sistema usar para cada petición, en función del tipo de tarea y el lenguaje/framework detectado en el código.

---

## Tipos de enrutamiento

### 1. Enrutamiento directo (`routeDirect`)

Algunas tareas no necesitan análisis previo del lenguaje (por ejemplo, `commit` o `naming-helper`) y van directamente al especialista sin pasar por el analista LLM.

```
Input → routeDirect() → Specialist → runStream()
```

### 2. Enrutamiento con analista (`routeWithAnalyst`)

Para tareas donde el contexto del lenguaje mejora la calidad de la respuesta (p.ej. `test` necesita saber si usar `pytest` o `vitest`):

```
Input → Analyst LLM → RoutingDecision → Specialist con prompt enriquecido → runStream()
```

Si el analista no está disponible o lanza error, se hace fallback automático al detector por regex.

---

## Detección de lenguaje (`detector.ts`)

Sistema basado en expresiones regulares que analiza los primeros 2.000 caracteres del input:

```typescript
type Language =
  | 'typescript'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'kotlin'
  | 'swift'
  | 'csharp'
  | 'cpp'
  | 'ruby'
  | 'php'

type DetectionResult = {
  language: Language | null
  confidence: 'high' | 'medium' | 'low'
}
```

- **Alta confianza**: 3 o más patrones coincidentes → sale anticipado.
- **Media**: 2 coincidencias.
- **Baja**: 1 coincidencia.

Ejemplos de patrones:

- TypeScript: `interface\s+\w+`, `:\s*(string|number|boolean)`, `<T>`, `as\s+\w+`
- Python: `def\s+\w+\(`, `import\s+\w+`, `self\.`, `__init__`
- Rust: `fn\s+\w+`, `let\s+mut`, `impl\s+\w+`, `->`, `use\s+std::`

---

## Analista LLM (`analyst.ts`)

Usa el modelo analista (por defecto `qwen2.5:0.5b`) para inferir más información que un regex no puede detectar:

```typescript
interface AnalystResult {
  language: Language | null
  framework: string | null // 'react', 'nextjs', 'pytest', 'vitest', etc.
  isDiff: boolean // ¿Es un git diff?
  confidence: 'high' | 'medium' | 'low'
}
```

El analista recibe el código con un prompt de sistema diseñado para devolver JSON estructurado con la menor cantidad de tokens posible.

---

## Especialistas (`specialists.ts`)

Cada tarea tiene una configuración `SpecialistConfig`:

```typescript
interface SpecialistConfig {
  taskType: TaskType
  modelId: string // del model-config del usuario
  buildSystemPrompt: (context: AnalystResult) => string
  displayName: string // nombre en la UI
}
```

Los modelos disponibles se organizan por **runtime**:

| Runtime | Descripción                                           |
| ------- | ----------------------------------------------------- |
| `small` | SLMs muy pequeños (0.5b–1.5b), para hardware limitado |
| `local` | SLMs medianos (3b–7b), para hardware estándar         |
| `cloud` | Modelos cloud vía API (OpenAI, Anthropic…)            |

La configuración activa se lee de `model-config.ts` (localStorage + IDB).

---

## Prompts de sistema (`src/lib/prompts/`)

Cada tarea tiene su propio constructor de prompt:

```typescript
// src/lib/prompts/test.ts
export function buildTestPrompt(context: AnalystResult): string {
  const framework = context.framework ?? inferTestFramework(context.language)
  return `You are a senior ${context.language} developer.
Generate comprehensive unit tests using ${framework}.
Focus on edge cases, error handling, and coverage.
...`
}
```

Los prompts inyectan:

- Lenguaje detectado
- Framework detectado (especialmente relevante para tests)
- Si es un diff (para commit, refactor)
- Instrucciones específicas de la tarea

---

## Tipos de tarea (`TaskType`)

```typescript
// src/lib/schemas/route.ts
export const TaskType = z.enum([
  'explain',
  'test',
  'refactor',
  'commit',
  'docstring',
  'type-hints',
  'error-explain',
  'performance-hint',
  'naming-helper',
  'dead-code',
])
```

### Detalles de cada tarea

| Tarea              | Analista | Descripción del prompt                                    |
| ------------------ | -------- | --------------------------------------------------------- |
| `explain`          | Sí       | Explicación de nivel senior del código                    |
| `test`             | Sí       | Tests con el framework detectado (pytest, Vitest, JUnit…) |
| `refactor`         | Sí       | Mejoras de calidad y legibilidad                          |
| `commit`           | No       | Mensaje de commit conciso desde diff                      |
| `docstring`        | Sí       | Comentarios de documentación (JSDoc, docstrings Python…)  |
| `type-hints`       | Sí       | Anotaciones de tipos (TypeScript, Python mypy)            |
| `error-explain`    | No       | Análisis de causa raíz + pasos de solución                |
| `performance-hint` | Sí       | Optimizaciones de rendimiento                             |
| `naming-helper`    | No       | Sugerencias de renombrado                                 |
| `dead-code`        | Sí       | Identificación de código inalcanzable                     |

---

## `RoutingDecision`

El router emite este objeto antes de llamar al especialista:

```typescript
interface RoutingDecision {
  taskType: TaskType
  specialistName: string
  modelId: string
  language: Language | null
  framework: string | null
  routingMethod: 'analyst' | 'detector' | 'direct'
  systemPrompt: string
}
```

Este objeto se emite como evento SSE `routing_step` al frontend para mostrar el progreso en tiempo real.

---

## Eventos SSE de enrutamiento

Durante el proceso de routing, el servidor emite pasos de progreso:

```
event: routing_step
data: {"step":"guard_check","label":"Validating input...","status":"active"}

event: routing_step
data: {"step":"detecting_language","label":"Analyzing code...","status":"active"}

event: routing_step
data: {"step":"routing_to_specialist","label":"→ explain (qwen2.5:7b)","status":"done"}

event: response_chunk
data: {"text":"This function implements..."}
```

El frontend consume estos eventos en `buildStreamCallbacks()` y actualiza el `chat-store` en tiempo real.
