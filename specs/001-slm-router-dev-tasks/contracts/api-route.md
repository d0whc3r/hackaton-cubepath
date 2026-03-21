# API Contract: POST /api/route

**Version**: 1.0 | **Date**: 2026-03-21

## Overview

Single endpoint that accepts a developer task request and returns a Server-Sent Events (SSE) stream. The stream emits routing progress steps, the specialist response (chunked), and a final cost estimate.

## Request

```
POST /api/route
Content-Type: application/json
```

### Body

```json
{
  "input": "function add(a, b) { return a + b }",
  "taskType": "explain"
}
```

| Field      | Type     | Required | Description |
|------------|----------|----------|-------------|
| `input`    | `string` | Yes      | Code snippet, diff, or change description. Min 1 char, max 8000 chars. |
| `taskType` | `string` | Yes      | One of: `"explain"`, `"test"`, `"refactor"`, `"commit"` |

### Validation Errors

```
400 Bad Request
Content-Type: application/json

{ "error": "EMPTY_INPUT", "message": "Input must not be empty" }
{ "error": "INVALID_TASK_TYPE", "message": "taskType must be one of: explain, test, refactor, commit" }
{ "error": "INPUT_TOO_LARGE", "message": "Input exceeds 8000 character limit" }
```

## Response

```
200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

The response is a sequence of SSE events. Each event has a named `event` field and a JSON `data` field.

### Event: `routing_step`

Emitted multiple times during routing. Drives the animated routing panel.

```
event: routing_step
data: {"step":"detecting_language","label":"Detecting language...","status":"active"}

event: routing_step
data: {"step":"detecting_language","label":"TypeScript detected","detail":"TypeScript","status":"done"}

event: routing_step
data: {"step":"analyzing_task","label":"Analyzing task type...","status":"active"}

event: routing_step
data: {"step":"analyzing_task","label":"Task: explain code","status":"done"}

event: routing_step
data: {"step":"selecting_specialist","label":"Selecting specialist...","status":"active"}

event: routing_step
data: {"step":"selecting_specialist","label":"Explanation Specialist selected","status":"done"}

event: routing_step
data: {"step":"generating_response","label":"Generating response...","status":"active"}
```

**Step values**:

| `step` | When emitted |
|--------|-------------|
| `detecting_language` | Language heuristic running |
| `analyzing_task` | Task type being processed |
| `selecting_specialist` | Specialist lookup |
| `generating_response` | Model call in progress |

**Status values**: `"pending"` → `"active"` → `"done"` (or `"error"`)

### Event: `specialist_selected`

Emitted once when the routing decision is final.

```
event: specialist_selected
data: {"specialistId":"explanation-specialist","displayName":"Explanation Specialist","reason":"explain task → Explanation Specialist","language":"TypeScript"}
```

| Field           | Type   | Description |
|-----------------|--------|-------------|
| `specialistId`  | string | Internal specialist identifier |
| `displayName`   | string | Human-readable name for UI display |
| `reason`        | string | Short routing rationale shown in panel |
| `language`      | string | Detected language, or `"unknown"` |

### Event: `response_chunk`

Emitted one or more times as the specialist model streams its response.

```
event: response_chunk
data: {"text":"This function takes two parameters"}

event: response_chunk
data: {" and returns their sum."}
```

### Event: `cost`

Emitted once, after the model response completes.

```
event: cost
data: {"inputTokens":87,"outputTokens":134,"specialistCostUsd":0.0000011,"largeModelCostUsd":0.0000132,"savingsPct":92}
```

| Field                | Type   | Description |
|----------------------|--------|-------------|
| `inputTokens`        | number | Estimated input tokens (chars ÷ 4) |
| `outputTokens`       | number | Estimated output tokens (chars ÷ 4) |
| `specialistCostUsd`  | number | Estimated cost using specialist model (USD) |
| `largeModelCostUsd`  | number | Estimated equivalent cost using large model (USD) |
| `savingsPct`         | number | Percentage saved vs. large model (0–100) |

### Event: `error`

Emitted if the specialist call fails. The stream closes after this event.

```
event: error
data: {"code":"SPECIALIST_UNAVAILABLE","message":"The specialist model is temporarily unavailable. Please try again."}
```

### Event: `interrupted`

Emitted when the stream is cut before completion (network drop, timeout, or user cancel). Any `response_chunk` events received prior to this event contain the partial response and MUST be preserved in the UI. No retry is issued automatically — the user must retry manually.

```
event: interrupted
data: {}
```

**Interruption sequence**:
```
response_chunk (partial) → ... → interrupted → stream close
```

### Event: `done`

Emitted as the final event in every successful stream.

```
event: done
data: {}
```

## Sequence Diagram

```
Client                          /api/route                      Ollama
  │                                  │                              │
  │── POST {input, taskType} ────────▶│                              │
  │                                  │ detect language               │
  │◀─ routing_step (detecting) ───────│                              │
  │◀─ routing_step (done) ────────────│                              │
  │◀─ routing_step (analyzing) ───────│                              │
  │◀─ routing_step (done) ────────────│                              │
  │◀─ routing_step (selecting) ───────│                              │
  │◀─ specialist_selected ────────────│                              │
  │◀─ routing_step (generating) ──────│── streamText call ──────────▶│
  │                                  │◀─ stream chunks ──────────────│
  │◀─ response_chunk ─────────────────│                              │
  │◀─ response_chunk ─────────────────│                              │
  │◀─ cost ───────────────────────────│                              │
  │◀─ done ───────────────────────────│                              │

Interruption path:
  │◀─ response_chunk (partial) ───────│                              │
  │◀─ interrupted ────────────────────│ (timeout / network / cancel) │
```
