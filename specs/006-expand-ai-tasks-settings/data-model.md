# Data Model: Expand AI Tasks & Settings Redesign

**Phase 1 output** | Branch: `006-expand-ai-tasks-settings`

---

## TaskType (enum extension)

**Current values**: `explain | test | refactor | commit`
**New values added**: `docstring | type-hints | error-explain | performance-hint | naming-helper | dead-code`

**Source**: `src/lib/schemas/route.ts` — `TaskTypeSchema`

**Routing classification**:
- `explain | test | refactor | commit` → analyst-routed (existing path)
- `docstring | type-hints | error-explain | performance-hint | naming-helper | dead-code` → direct-routed (new path, bypasses analyst)

---

## ModelConfig (interface extension)

**File**: `src/lib/config/model-config.ts`

```typescript
// Existing fields (unchanged)
analystModel: string
explainModel: string
testModel: string
refactorModel: string
commitModel: string
translateModel: string
ollamaBaseUrl: string

// New fields added
docstringModel: string        // default: 'phi3.5'
typeHintsModel: string        // default: 'qwen2.5-coder:7b'
errorExplainModel: string     // default: 'phi3.5'
performanceHintModel: string  // default: 'qwen2.5-coder:7b'
namingHelperModel: string     // default: 'phi3.5'
deadCodeModel: string         // default: 'qwen2.5-coder:7b'
```

**Persistence**: `localStorage` key `slm-router-model-config`. Existing stored configs get new keys from `DEFAULTS` automatically via the merge-over-defaults pattern in `loadModelConfig()` — no migration needed.

**`TASK_MODEL_KEY` mapping update**:
```typescript
// New entries added to the Record<TaskType, keyof ModelConfig> map
'docstring'       → 'docstringModel'
'type-hints'      → 'typeHintsModel'
'error-explain'   → 'errorExplainModel'
'performance-hint'→ 'performanceHintModel'
'naming-helper'   → 'namingHelperModel'
'dead-code'       → 'deadCodeModel'
```

---

## RouteRequestSchema (schema extension)

**File**: `src/lib/schemas/route.ts`

New optional model override fields added (follow same pattern as existing fields):
```typescript
docstringModel: z.string().optional()
typeHintsModel: z.string().optional()
errorExplainModel: z.string().optional()
performanceHintModel: z.string().optional()
namingHelperModel: z.string().optional()
deadCodeModel: z.string().optional()
```

`taskType` enum extended with 6 new values.

---

## SectionDef (settings UI)

**File**: `src/components/model/settings/types.ts`

**`SectionId`** extended:
```typescript
// Current
'analyst' | 'explain' | 'test' | 'refactor' | 'commit' | 'translate'

// New values added
| 'docstring' | 'type-hints' | 'error-explain' | 'performance-hint' | 'naming-helper' | 'dead-code'
```

**`SectionGroupId`** replaced:
```typescript
// Old (removed)
'management' | 'code' | 'language'

// New
'infrastructure' | 'analysis' | 'generation' | 'language'
```

**Group → Section mapping**:
| Group | Sections |
|-------|----------|
| `infrastructure` | analyst |
| `analysis` | explain, error-explain, performance-hint, dead-code, naming-helper |
| `generation` | test, refactor, docstring, type-hints, commit |
| `language` | translate |

---

## New Model List Files

Each file exports `{TASK}_MODELS: ModelOption[]` and `DEFAULT_{TASK}_MODEL: string`.

| File | Default model |
|------|---------------|
| `src/lib/router/models/docstring.ts` | `phi3.5` |
| `src/lib/router/models/type-hints.ts` | `qwen2.5-coder:7b` |
| `src/lib/router/models/error-explain.ts` | `phi3.5` |
| `src/lib/router/models/performance-hint.ts` | `qwen2.5-coder:7b` |
| `src/lib/router/models/naming-helper.ts` | `phi3.5` |
| `src/lib/router/models/dead-code.ts` | `qwen2.5-coder:7b` |

`src/lib/router/models/index.ts` updated to export new lists and include them in `MODELS_BY_TASK` and `DEFAULT_MODELS`.

---

## New Prompt Files

Each file exports a `build{Task}Prompt(context: CodeContext): string` function.

| File | Output contract |
|------|----------------|
| `src/lib/prompts/docstring.ts` | Returns code enriched with documentation comments |
| `src/lib/prompts/type-hints.ts` | Returns same code with type annotations only |
| `src/lib/prompts/error-explain.ts` | Returns root-cause explanation + numbered fix steps |
| `src/lib/prompts/performance-hint.ts` | Returns advisory suggestion list, no code rewrite |
| `src/lib/prompts/naming-helper.ts` | Returns `before → after` rename list with rationale |
| `src/lib/prompts/dead-code.ts` | Returns issue list (name + location), no code rewrite |

---

## Direct Router (new module)

**File**: `src/lib/router/direct.ts`

```typescript
interface DirectRouteResult {
  modelId: string
  systemPrompt: string
  displayName: string
}

function routeDirect(
  taskType: NewTaskType,
  input: string,
  modelId: string,
  baseUrl: string
): DirectRouteResult
```

Used by the API route when `taskType` is one of the 6 new task types. Builds the system prompt for the task and returns the model to call — no analyst LLM call, no language detection.

---

## Error Explain Input Contract (client-side only)

The `error-explain` task page renders two text areas:
- **Error message** (required): labelled "Error message"
- **Code snippet** (optional): labelled "Code snippet (optional)"

Before submission, the client combines them:
```
ERROR:
{errorMessage}

CODE:
{codeSnippet}
```

This formatted string is sent as the `input` field. The API schema is unchanged. The `error-explain` prompt builder is aware of this format.

---

## Navigation Data

**AppSidebar** — new entries in `TASK_ITEMS`:
```typescript
{ href: '/tasks/error-explain',    icon: AlertCircle, label: 'Error Explain'    }
{ href: '/tasks/docstring',        icon: FileText,    label: 'Docstring'         }
{ href: '/tasks/type-hints',       icon: Type,        label: 'Type Hints'        }
{ href: '/tasks/performance-hint', icon: Zap,         label: 'Performance Hint'  }
{ href: '/tasks/naming-helper',    icon: Tag,         label: 'Naming Helper'     }
{ href: '/tasks/dead-code',        icon: Trash2,      label: 'Dead Code'         }
```

Sidebar gains two labeled groups: **Analysis** and **Generation** (matching settings tabs).

**TASK_PATH_BY_TYPE** extended with 6 new entries.

**OverviewTaskCards** — renders two `<section>` groups:
- **Analysis**: explain, error-explain, performance-hint, dead-code, naming-helper
- **Generation**: test, refactor, docstring, type-hints, commit
