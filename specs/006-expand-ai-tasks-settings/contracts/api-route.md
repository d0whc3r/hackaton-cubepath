# API Route Contract: POST /api/route

**File**: `src/pages/api/route.ts`
**Contract type**: HTTP POST + Server-Sent Events (SSE)

---

## Request Schema Changes

### New `taskType` values

```typescript
// Before
z.enum(['explain', 'test', 'refactor', 'commit'])

// After (additions only — existing values unchanged)
z.enum([
  'explain', 'test', 'refactor', 'commit',           // existing
  'docstring', 'type-hints', 'error-explain',         // new
  'performance-hint', 'naming-helper', 'dead-code',  // new
])
```

### New optional model override fields

```typescript
// Added to RouteRequestSchema (all optional, same pattern as existing)
docstringModel:        z.string().optional()
typeHintsModel:        z.string().optional()
errorExplainModel:     z.string().optional()
performanceHintModel:  z.string().optional()
namingHelperModel:     z.string().optional()
deadCodeModel:         z.string().optional()
```

### `input` field — no change

`input: z.string().min(1).max(8000)` is unchanged.

For `error-explain`, the client sends a formatted combination:
```
ERROR:
{errorMessage}

CODE:
{codeSnippet}
```

---

## Response Stream — Routing Paths

### Existing tasks (`explain | test | refactor | commit`)

SSE event sequence — **unchanged**:
```
routing_step  { step: 'detecting_language', status: 'active' }
routing_step  { step: 'detecting_language', status: 'done', detail: '<language>' }
routing_step  { step: 'analyzing_task',     status: 'active' }
routing_step  { step: 'analyzing_task',     status: 'done',   detail: '<taskType>' }
routing_step  { step: 'selecting_specialist', status: 'active' }
routing_step  { step: 'selecting_specialist', status: 'done' }
specialist_selected { displayName, language, modelId, reason, specialistId }
routing_step  { step: 'generating_response', status: 'active' }
response_chunk { text: '<chunk>' }  // repeated
routing_step  { step: 'generating_response', status: 'done' }
cost          { inputTokens, outputTokens, savingsPct, ... }
done          {}
```

### New tasks (`docstring | type-hints | error-explain | performance-hint | naming-helper | dead-code`)

SSE event sequence — **simplified** (no analyst call, no language detection):
```
routing_step      { step: 'generating_response', status: 'active' }
specialist_selected { displayName: '<Task> Specialist', modelId, language: 'code', specialistId: '<task>-specialist' }
response_chunk    { text: '<chunk>' }  // repeated
routing_step      { step: 'generating_response', status: 'done' }
cost              { inputTokens, outputTokens, savingsPct, ... }
done              {}
```

Note: `specialist_selected` is emitted so the frontend consistently shows which model is running for both existing and new tasks.

### Error events — unchanged for both paths

```
error         { code: 'SPECIALIST_UNAVAILABLE' | 'INTERNAL', message: string }
interrupted   {}
```

---

## Environment Variables — New additions

```bash
OLLAMA_DOCSTRING_MODEL=<model-id>
OLLAMA_TYPE_HINTS_MODEL=<model-id>
OLLAMA_ERROR_EXPLAIN_MODEL=<model-id>
OLLAMA_PERFORMANCE_HINT_MODEL=<model-id>
OLLAMA_NAMING_HELPER_MODEL=<model-id>
OLLAMA_DEAD_CODE_MODEL=<model-id>
```

Priority resolution (same 3-tier pattern as existing):
`request body override → env var → compiled-in default`

---

## Backwards Compatibility

- Existing task types (`explain | test | refactor | commit`) are **unaffected**.
- Existing request/response shape for those tasks is **unchanged**.
- No breaking changes to the SSE event schema — new tasks emit a subset of existing event types.
- The simplified SSE sequence for new tasks omits analyst-related events; clients that render routing steps will simply show fewer steps for new tasks.
