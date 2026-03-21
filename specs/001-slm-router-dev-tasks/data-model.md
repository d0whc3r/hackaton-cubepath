# Data Model: Intelligent SLM Router for Developer Tasks

**Branch**: `001-slm-router-dev-tasks` | **Date**: 2026-03-21

## Core Types

### TaskType

```typescript
type TaskType = "explain" | "test" | "refactor" | "commit";
```

### RouteRequest

Represents a single user submission entering the router.

```typescript
interface RouteRequest {
  input: string;       // Raw code, diff, or description from the user
  taskType: TaskType;  // Selected task category
}
```

### DetectedLanguage

Result of the language detection step.

```typescript
interface DetectedLanguage {
  language: string;    // e.g., "TypeScript", "Python", "unknown"
  confidence: "high" | "medium" | "low";
}
```

### SpecialistConfig

Defines a specialist: which model to call and how to prompt it.

```typescript
interface SpecialistConfig {
  id: string;                // e.g., "commit-specialist", "explanation-specialist"
  displayName: string;       // Shown in the routing panel, e.g., "Commit Specialist"
  modelId: string;           // Ollama model name, e.g. "phi3.5", "qwen2.5-coder:7b"
  buildSystemPrompt: (language: DetectedLanguage, input: string) => string;
  //                                              ^^^^^^^^^^^^
  //  `input` is available to all specialists but only used by commit-specialist
  //  to detect whether the submission is a raw diff or a prose description.
  //  All other specialists may ignore it.
}
```

### RoutingDecision

The output of the router before calling the specialist.

```typescript
interface RoutingDecision {
  specialist: SpecialistConfig;
  detectedLanguage: DetectedLanguage;
  systemPrompt: string;      // Final assembled system prompt
  routingReason: string;     // Human-readable explanation, shown in panel
}
```

### RoutingStep

A single step emitted during the animated routing panel sequence.

```typescript
interface RoutingStep {
  step: "detecting_language" | "analyzing_task" | "selecting_specialist" | "generating_response";
  label: string;             // User-facing label, e.g., "Detecting language..."
  detail?: string;           // Optional extra detail, e.g., "TypeScript detected"
  status: "pending" | "active" | "done" | "error";
}
```

### CostEstimate

Shown alongside every response as the live cost comparison.

```typescript
interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  specialistCostUsd: number;      // Cost using the small specialist model
  largeModelCostUsd: number;      // Equivalent cost using a large general model
  savingsPct: number;             // e.g., 72 (= 72% cheaper)
}
```

## SSE Event Stream Schema

The `/api/route` endpoint emits a sequence of Server-Sent Events:

```
event: routing_step
data: { "step": "detecting_language", "label": "Detecting language...", "status": "active" }

event: routing_step
data: { "step": "detecting_language", "label": "TypeScript detected", "detail": "TypeScript", "status": "done" }

event: routing_step
data: { "step": "analyzing_task", "label": "Analyzing task type...", "status": "active" }

event: routing_step
data: { "step": "selecting_specialist", "label": "Selecting specialist...", "status": "active" }

event: specialist_selected
data: { "specialistId": "refactor-specialist", "displayName": "Refactor Specialist", "reason": "Refactor task → Refactor Specialist", "language": "TypeScript" }

event: routing_step
data: { "step": "generating_response", "label": "Generating response...", "status": "active" }

event: response_chunk
data: { "text": "Here is the refactored version..." }

event: response_chunk
data: { "text": " with improved readability." }

event: cost
data: { "inputTokens": 312, "outputTokens": 187, "specialistCostUsd": 0.00000125, "largeModelCostUsd": 0.000015, "savingsPct": 92 }

event: done
data: {}

--- Interruption path (timeout / cancel / network drop) ---

event: response_chunk
data: { "text": "Here is the refactored..." }

event: interrupted
data: {}
```

## Specialist Registry (Static Configuration)

Four entries in `SPECIALISTS: Record<TaskType, SpecialistConfig>`, one per `TaskType` key:

| TaskType key  | Specialist ID            | Display Name           | Ollama Model (`modelId`)   | Env var              |
|---------------|--------------------------|------------------------|----------------------------|----------------------|
| `explain`     | `explanation-specialist` | Explanation Specialist | `phi3.5`                   | `OLLAMA_EXPLAIN_MODEL` |
| `test`        | `test-specialist`        | Test Specialist        | `qwen2.5-coder:7b`         | `OLLAMA_CODE_MODEL`  |
| `refactor`    | `refactor-specialist`    | Refactor Specialist    | `qwen2.5-coder:7b`         | `OLLAMA_CODE_MODEL`  |
| `commit`      | `commit-specialist`      | Commit Specialist      | `qwen2.5-coder:7b`         | `OLLAMA_CODE_MODEL`  |

`modelId` values are read from environment variables at runtime (not hardcoded), so swapping models requires only a config change. `refactor-specialist`, `test-specialist`, and `commit-specialist` share the same `modelId` env var but are **separate `SpecialistConfig` objects** with distinct `id`, `displayName`, and `buildSystemPrompt` — demonstrating the SLM-MUX concept: routing = model selection + prompt engineering.
