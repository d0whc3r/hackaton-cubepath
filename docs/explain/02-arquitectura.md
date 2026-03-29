# Arquitectura — SLM Router

## Diseño de tres planos

El sistema está organizado en tres planos con responsabilidades bien diferenciadas:

---

### Plano de Control — _Inteligencia de enrutamiento_

**Responsabilidad**: analizar el input del usuario y decidir qué especialista debe atender la petición.

- El modelo **analista** (`qwen2.5:0.5b` por defecto) recibe el código y detecta:
  - Lenguaje de programación (TypeScript, Python, Rust, Go, Java…)
  - Framework (React, Next.js, pytest, Vitest, JUnit…)
  - Contexto de diff (si el input es un `git diff`)
- Si el analista no está disponible, un sistema de detección por **expresiones regulares** (`detector.ts`) actúa como fallback.
- Algunas tareas evitan al analista y van directas al especialista (_fast path_).

---

### Plano de Ejecución — _Especialistas por tarea_

**Responsabilidad**: generar la respuesta con el modelo correcto y el prompt de sistema adecuado.

- 10 tipos de tarea con modelos y prompts dedicados.
- `runStream()` gestiona el streaming con:
  - Timeout de 5 minutos (optimizado para hardware de consumo)
  - **Auto-continuación**: si el modelo corta la respuesta por límite de tokens, se lanza una segunda petición con el contexto de los últimos 2 KB para continuar.
- El streaming llega directamente desde Ollama al navegador vía `streamText()` del Vercel AI SDK.

---

### Plano de Experiencia — _UX del operador_

**Responsabilidad**: presentar resultados en tiempo real y persistir el estado de la sesión.

- Historial de conversación por tarea (IndexedDB).
- Indicadores de progreso en vivo durante el enrutamiento.
- Post-procesado opcional de traducción.
- Comparativa de costes en tiempo real.
- Indicadores de notificaciones no leídas para tareas completadas en background.

---

## Diagrama de flujo de una petición

> **Arquitectura 100% cliente**: no existe servidor de aplicación intermedio. Todo — RailGuard, enrutamiento, llamadas al modelo — se ejecuta en el navegador del usuario. Ollama es llamado directamente desde el cliente vía `fetch`.

```
┌──────────────────────────────────────────────────────────────────┐
│                   Navegador — React Islands (client:only)         │
│                                                                   │
│  ChatInput ──► useChatSession ──► buildRouteMutationOptions()     │
│                                                                   │
│  1. RailGuard (client-side)                                       │
│     ├── sanitise()             ← reglas estáticas (regex)         │
│     └── validateInputSemantic() ← guard LLM vía Ollama           │
│                                                                   │
│  2. Router (client-side)                                          │
│     ├── ¿fast-path? ──► routeDirect()                             │
│     └── routeWithAnalyst()                                        │
│         ├── analyst LLM detecta lenguaje/framework                │
│         └── detector.ts como fallback (regex)                     │
│                                                                   │
│  3. Specialist (client-side)                                      │
│     └── runStream() ──► streaming directo a Ollama                │
│         ├── streamText() [Vercel AI SDK]                          │
│         ├── auto-continue si token limit                          │
│         └── callbacks: routing_step / response_chunk / cost       │
│                                                                   │
│  chat-store (useSyncExternalStore)                                │
│     ├── buildStreamCallbacks() aplica eventos → store             │
│     └── IndexedDB persiste historial por tarea                    │
└──────────────────────────────────────┬───────────────────────────┘
                                       │ fetch (OpenAI-compatible API)
                                       ▼
                           ┌───────────────────────┐
                           │   Ollama local         │
                           │   http://localhost:11434│
                           └───────────────────────┘
```

---

## Principios de diseño clave

| Principio                          | Implementación                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Fail-open en seguridad**         | El guard semántico permite el paso si hay timeout o ambigüedad; las reglas estáticas son la capa autoritativa. |
| **Especialistas, no generalistas** | Cada tarea tiene prompt y modelo propios; nunca un único modelo "hace todo".                                   |
| **Continuación automática**        | Si el SLM alcanza el límite de tokens, el sistema continúa automáticamente.                                    |
| **Almacenamiento transparente**    | Una abstracción única (`getStorageEngine`) decide si usar IDB o localStorage.                                  |
| **React Islands + Astro**          | Solo las partes interactivas se hidratan como React; el resto es HTML estático.                                |
| **Diff de configuración**          | Solo se persisten valores distintos al default, reduciendo el overhead de almacenamiento.                      |
