# Research: Expand AI Tasks & Settings Redesign

**Phase 0 output** | Branch: `006-expand-ai-tasks-settings`

---

## 1. Direct Routing for New Tasks (bypass analyst)

**Decision**: New tasks use a `routeDirect()` path that skips the analyst model entirely.

**Rationale**: The analyst exists to classify ambiguous input and route to the right specialist. For new tasks the user explicitly selects the task from the UI — there is no ambiguity to resolve. Calling the analyst adds latency with zero routing benefit.

**Implementation approach**:
- Add a `routeDirect(taskType, input, modelId, baseUrl)` function in `src/lib/router/direct.ts`.
- In `src/pages/api/route.ts`, detect whether `taskType` belongs to the new task set and branch accordingly.
- New tasks emit only the `generating_response` routing step (no language detection, no task analysis, no specialist selection events) — this keeps the SSE stream predictable and the frontend's existing step rendering still works.

**Alternatives considered**:
- Keep analyst routing for all tasks: rejected — analyst adds ~1–2s latency and provides no value when the task is pre-selected.
- Create a separate API endpoint for new tasks: rejected — unnecessary duplication of SSE infrastructure; a branch inside the existing route handler is simpler.

---

## 2. Error Explain Dual Input

**Decision**: The Error Explain task page provides two text areas (error message + optional code snippet). The client concatenates them into a single formatted string before submitting to the API — no API schema change required.

**Format used by the client**:
```
ERROR:
{errorMessage}

CODE:
{codeSnippet}
```

**Rationale**: The existing API schema (`input: string`) remains unchanged, keeping the contract stable. The prompt builder for `error-explain` is aware of the format separator and can parse/reference both sections in the system prompt.

**Alternatives considered**:
- Add a `secondaryInput` field to `RouteRequestSchema`: rejected — increases schema surface, requires API changes, and all other tasks don't need it.
- Single text area for Error Explain: rejected — users would need to manually format their input; poor UX.

---

## 3. ModelConfig Storage Schema Evolution

**Decision**: Add 6 new keys to `ModelConfig` with defaults. Use the existing merge-over-defaults pattern in `loadModelConfig()`.

**New keys**:
```typescript
docstringModel: string        // default: 'phi3.5'
typeHintsModel: string        // default: 'qwen2.5-coder:7b'
errorExplainModel: string     // default: 'phi3.5'
performanceHintModel: string  // default: 'qwen2.5-coder:7b'
namingHelperModel: string     // default: 'phi3.5'
deadCodeModel: string         // default: 'qwen2.5-coder:7b'
```

**Rationale**: The existing `{ ...DEFAULTS, ...storedValue }` merge pattern in `loadModelConfig()` means any user who already has a stored config will get the new keys filled from DEFAULTS automatically — no migration needed, no data loss.

**Alternatives considered**:
- Versioned config with migration: rejected — overkill for a localStorage key-value store; the merge pattern already handles new keys gracefully.

---

## 4. Settings Group Redesign

**Decision**: Rename and add `SectionGroupId` values: `'management' | 'code' | 'language'` → `'infrastructure' | 'analysis' | 'generation' | 'language'`.

**Task assignments**:
| Tab | Tasks |
|-----|-------|
| Infrastructure | analyst |
| Analysis | explain, error-explain, performance-hint, dead-code, naming-helper |
| Generation | test, refactor, docstring, type-hints, commit |
| Language | translate |

**Rationale**: `management` implied lifecycle/admin tasks; `infrastructure` better describes the analyst's role. Splitting `code` into `analysis` (read, inspect, explain) and `generation` (produce new content) maps to the user's mental model confirmed in clarifications Q1 and Q2.

**Breaking change**: The `SectionGroupId` rename from `management`/`code` is a compile-time change only — no stored data references group IDs, so no migration needed.

---

## 5. Recommended Model Lists for New Tasks

### Docstring / Comments
| Model | Params | Why |
|-------|--------|-----|
| `phi3.5` ⭐ default | 3.8B | Excellent instruction following; natural language output; fast |
| `qwen2.5-coder:7b` | 7B | Strong code understanding; better for complex multi-parameter functions |
| `qwen2.5-coder:3b` | 3B | Balanced; good for simple functions |
| `gemma3:4b` | 4B | Good multilingual docstring support |

### Type Hints
| Model | Params | Why |
|-------|--------|-----|
| `qwen2.5-coder:7b` ⭐ default | 7B | SOTA for code tasks ≤8GB VRAM; understands TS, Python, Java type systems |
| `qwen2.5-coder:3b` | 3B | Fast; sufficient for simple functions |
| `qwen2.5-coder:1.5b` | 1.5B | Minimal footprint; works for straightforward typings |
| `deepseek-coder-v2:16b` | 16B | Best for complex generics and advanced type inference |

### Error Explain
| Model | Params | Why |
|-------|--------|-----|
| `phi3.5` ⭐ default | 3.8B | SLMs excel at error explanation; fast feedback matters most here |
| `llama3.2:3b` | 3B | Very fast; surprisingly good at common runtime errors |
| `gemma3:4b` | 4B | Good at step-by-step reasoning |
| `qwen2.5:3b` | 3B | Broad error knowledge; handles framework-specific errors well |
| `llama3.2:1b` | 1B | Ultra-fast; sufficient for well-known error patterns |

### Performance Hint
| Model | Params | Why |
|-------|--------|-----|
| `qwen2.5-coder:7b` ⭐ default | 7B | Strong algorithmic reasoning; understands Big-O implications |
| `deepseek-coder-v2:16b` | 16B | Best for complex algorithmic analysis (queries, nested loops) |
| `gemma3:12b` | 12B | Good reasoning with larger context for multi-function analysis |
| `qwen2.5-coder:3b` | 3B | Lighter option; good for simple loop/collection optimizations |

### Naming Helper
| Model | Params | Why |
|-------|--------|-----|
| `phi3.5` ⭐ default | 3.8B | Strong instruction following; reliable structured list output |
| `gemma3:4b` | 4B | Good naming intuition across multiple languages |
| `llama3.2:3b` | 3B | Fast; good at natural language naming conventions |
| `qwen2.5:3b` | 3B | Good for domain-specific naming (e.g., data science identifiers) |

### Dead Code / Cleanup
| Model | Params | Why |
|-------|--------|-----|
| `qwen2.5-coder:7b` ⭐ default | 7B | Understands code semantics needed to detect dead imports and unreachable paths |
| `qwen2.5-coder:3b` | 3B | Lighter option; good for simple unused import detection |
| `phi3.5` | 3.8B | Good structured reporting; reliable list output format |
| `deepseek-coder-v2:16b` | 16B | Best for large files with complex control flow analysis |

---

## 6. Home Page Grouped Layout

**Decision**: `OverviewTaskCards` renders two labeled sections — **Analysis** and **Generation** — each containing the relevant task cards. Infrastructure (analyst) and Language (translate) are not shown on the home page as they are not user-facing tasks.

**Rationale**: Matches the settings tab structure (clarification Q3), giving users one consistent mental model. Infrastructure and Language tasks don't have task pages (analyst is internal; translate is embedded in tasks), so they don't appear on the home page.

**Alternatives considered**:
- Show all 10 tasks flat: rejected — loses the grouping benefit and makes the page feel like a list dump.
- Show a "More tools" section below existing 4: rejected — implies new tasks are secondary/lesser; all tasks should be equally discoverable.

---

## 7. Input Validation Approach

**Decision**: Client-side inline validation on submit attempt. Required fields show an inline error message below the field when the user clicks submit with an empty value. The request is not sent.

**Rationale**: Confirmed in clarification Q4. Consistent with standard web form UX. Prevents wasteful model calls for empty inputs.

**Implementation**: Each new task page manages a `touched` state per field. On submit, if required fields are empty, set `touched = true` for those fields and display the validation message. No change needed to API schema validation (which already rejects empty `input`).
