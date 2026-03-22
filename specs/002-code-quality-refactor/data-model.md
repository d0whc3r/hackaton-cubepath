# Data Model: Code Quality & Refactor

**Feature**: 002-code-quality-refactor
**Date**: 2026-03-22

> For a refactor, the "data model" describes the canonical codebase unit structure after refactoring — what gets extracted where, and why each layer boundary exists.

---

## Layer Architecture

```
┌─────────────────────────────────────────────────┐
│  PAGES (.astro)                                 │
│  Pure layout wiring — no logic                  │
│  src/pages/index.astro                          │
│  src/pages/tasks/*.astro  (already minimal)     │
│  src/pages/settings.astro                       │
└──────────────────┬──────────────────────────────┘
                   │ imports
┌──────────────────▼──────────────────────────────┐
│  COMPONENTS (.tsx)                              │
│  Pure rendering — no business logic             │
│  src/components/chat/                           │
│  src/components/model/                          │
│  src/components/layout/                         │
│  src/components/cost/                           │
│  src/components/markdown/                       │
└──────────────────┬──────────────────────────────┘
                   │ imports
┌──────────────────▼──────────────────────────────┐
│  HOOKS                                          │
│  State + effects + derived values               │
│  src/hooks/use-chat-session.ts    [NEW]         │
│  src/hooks/use-chat-input.ts      [NEW]         │
│  src/hooks/use-file-attachment.ts [NEW]         │
│  src/hooks/use-mobile.ts          [existing]    │
│  src/components/model/settings/   [existing]    │
└──────────────────┬──────────────────────────────┘
                   │ imports
┌──────────────────▼──────────────────────────────┐
│  LIB — domain logic, utilities, schemas         │
│  src/lib/config/     [NEW — split from Dialog]  │
│  src/lib/api/        [SSE helpers]              │
│  src/lib/router/     [routing engine]           │
│  src/lib/services/   [React Query mutations]    │
│  src/lib/cost/       [cost estimation]          │
│  src/lib/schemas/    [Zod schemas + TS types]   │
│  src/lib/utils/      [pure helpers]             │
│  src/lib/context/    [React Context + hook]     │
│  src/lib/prompts/    [LLM system prompts]       │
└─────────────────────────────────────────────────┘
```

---

## New Code Units

### `src/hooks/use-chat-session.ts`

**Responsibility**: All conversation state, persistence, and request lifecycle for `ChatContainer`.

**Interface**:
```typescript
interface UseChatSessionReturn {
  entries: ConversationEntry[]
  activeTask: TaskType
  isLoading: boolean
  currentModel: string
  setActiveTask: (task: TaskType) => void
  handleSubmit: (input: string, taskType: TaskType, fileName?: string) => void
  handleCancel: () => void
  handleClearHistory: () => void
}

function useChatSession(fixedTaskType?: TaskType): UseChatSessionReturn
```

**Extracted from**: `ChatContainer` (lines 31–122)
**Contains**: `useState`, `useEffect`, `useRef`, `useMutation`, `useCallback` (before compiler), all handler functions, `updateLastAssistant`, `mergeRoutingStep`

---

### `src/hooks/use-chat-input.ts`

**Responsibility**: Submit logic, keyboard shortcut, and derived display values for `ChatInput`.

**Interface**:
```typescript
interface UseChatInputReturn {
  displayTask: TaskType
  currentOption: TaskOption | undefined
  charCount: number
  overLimit: boolean
  modelLabel: string
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

function useChatInput(input: string, setInput: (v: string) => void): UseChatInputReturn
```

**Extracted from**: `ChatInput` (derived values + event handlers)
**Depends on**: `useChatContext`

---

### `src/hooks/use-file-attachment.ts`

**Responsibility**: File reading via FileReader API, attached filename state, and file removal.

**Interface**:
```typescript
interface UseFileAttachmentReturn {
  attachedFileName: string | null
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: () => void
}

function useFileAttachment(
  onContent: (content: string, fileName: string) => void,
  maxChars: number,
): UseFileAttachmentReturn
```

**Extracted from**: `ChatInput` (lines 43, 69–89)
**Note**: FileReader is a browser-only API; hook must not be called in SSR context. Astro's `client:load` directive already guarantees client-only execution for `ChatInput`.

---

### `src/lib/config/model-config.ts` *(NEW — split from ModelConfigDialog.tsx)*

**Responsibility**: All model configuration types, storage key, defaults, and accessor functions. Currently misplaced in a component file.

**Exports**:
```typescript
export interface ModelConfig { ... }         // type definition
export const DEFAULTS: ModelConfig           // default values
export const STORAGE_KEY: string             // localStorage key
export const TASK_MODEL_KEY: Record<TaskType, TaskModelKey>
export function loadModelConfig(): ModelConfig
export function getModelForTask(config: ModelConfig, task: TaskType): string
export function getAnalystModel(config: ModelConfig): string
export function getTranslateModel(config: ModelConfig): string
```

**Moved from**: `src/components/model/ModelConfigDialog.tsx`
**Reason**: Configuration logic has no business being in a component file. It is imported by `ChatContainer`, `ChatInput`, and the settings hooks — it belongs in `src/lib/`.

---

### `src/lib/api/resolve-model.ts` *(NEW — deduplicate)*

**Responsibility**: The `resolveModel(fromBody, fromEnv, fallback)` function exists identically in both `route.ts` AND `translate.ts`. Extract to shared module.

**Interface**:
```typescript
/** Resolves a model ID from request body, environment variable, or hard-coded fallback — in that priority order. */
export function resolveModel(
  fromBody: string | undefined,
  envVar: string | undefined,
  fallback: string,
): string
```

**Moved from**: `src/pages/api/route.ts` + `src/pages/api/translate.ts`

---

## Modified Code Units

### `src/pages/api/route.ts` — Decomposed `buildSSEStream`

**Before**: Single ~100-line function with 4 nested concerns.
**After**: Orchestrator of ~25 lines calling 4 named module-scoped functions:

```typescript
// Module-scoped, not exported — internal to the route handler
function emitLanguageDetection(decision: RoutingDecision, emit: SseEmitter): void
function emitTaskAnalysis(taskType: TaskType, emit: SseEmitter): void
function emitSpecialistSelection(decision: RoutingDecision, emit: SseEmitter): void
async function streamSpecialistResponse(
  ollama: ReturnType<typeof ollamaClient>,
  decision: RoutingDecision,
  input: string,
  systemPrompt: string,
  emit: SseEmitter,
  signal: AbortSignal,
): Promise<void>

// Orchestrator
function buildSSEStream(req: ValidatedRequest): ReadableStream { ... }
```

---

### `src/lib/router/analyst.ts` — Remove duplicated ollamaClient

**Before**: Creates `createOpenAI({ apiKey: 'ollama', baseURL: ... })` inline.
**After**: Imports `ollamaClient` from `src/lib/api/sse.ts`.
**Reason**: Single creation point for the Ollama–OpenAI adapter; eliminates config drift risk.

---

### `src/components/model/ModelConfigDialog.tsx` — Component only

**Before**: Exports both the nav button component AND all config utility functions.
**After**: Exports only `ModelConfigDialog` component. All utilities moved to `src/lib/config/model-config.ts`.
**Import updates required in**: `ChatContainer.tsx`, `ChatInput.tsx`, all settings hooks.

---

## Unchanged Units (Out of Scope)

| Unit | Reason |
|------|--------|
| `src/components/ui/` | shadcn/ui primitives — explicitly out of scope |
| `src/lib/schemas/route.ts` | Zod schema — no complexity issues |
| `src/lib/utils/sse.ts` (client) | Clean, well-structured |
| `src/lib/api/sse.ts` (server) | Clean, well-documented |
| `src/lib/services/route.service.ts` | Focused, single-purpose |
| `src/lib/router/index.ts` | Already minimal (30 lines) |
| `src/lib/router/specialists.ts` | Clean Factory pattern |
| `src/lib/cost/` | Clean, well-separated |
| `src/lib/prompts/` | Pure string builders |
| `src/pages/tasks/*.astro` | Already minimal (5 lines each) — no extraction needed |
