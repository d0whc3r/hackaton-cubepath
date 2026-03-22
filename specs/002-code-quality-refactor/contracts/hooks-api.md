# Contract: Public Hook & Utility APIs

**Feature**: 002-code-quality-refactor
**Date**: 2026-03-22

These are the public interfaces for all newly extracted hooks and utility functions. Implementation must match these signatures exactly. Tests are written against these contracts.

---

## `useChatSession(fixedTaskType?: TaskType): UseChatSessionReturn`

**File**: `src/hooks/use-chat-session.ts`
**Contract**:

```typescript
export interface UseChatSessionReturn {
  // State
  readonly entries: ConversationEntry[]
  readonly activeTask: TaskType
  readonly isLoading: boolean
  readonly currentModel: string
  // Commands
  setActiveTask: (task: TaskType) => void
  handleSubmit: (input: string, taskType: TaskType, fileName?: string) => void
  handleCancel: () => void
  handleClearHistory: () => void
}
```

**Invariants**:
- `entries` is initialised from `loadHistory(fixedTaskType ?? 'explain')` on mount
- `handleSubmit` appends a new `ConversationEntry` with `status: 'streaming'` before the mutation fires
- `handleCancel` aborts the in-flight request and sets the last entry's status to `'interrupted'`
- `handleClearHistory` empties `entries` and calls `clearHistory(activeTask)`
- When `fixedTaskType` is provided, `activeTask` never changes regardless of `setActiveTask` calls
- Changes to `entries` trigger a `saveHistory` side-effect

---

## `useChatInput(input: string, setInput: SetState<string>): UseChatInputReturn`

**File**: `src/hooks/use-chat-input.ts`
**Contract**:

```typescript
export interface UseChatInputReturn {
  readonly displayTask: TaskType
  readonly currentOption: { value: TaskType; label: string; placeholder: string } | undefined
  readonly charCount: number
  readonly overLimit: boolean
  readonly modelLabel: string
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}
```

**Invariants**:
- `overLimit` is `true` when `input.length > MAX_CHARS` (8000)
- `onSubmit` is a no-op when `input.trim()` is empty, `overLimit` is `true`, or `isLoading` is `true`
- `onKeyDown` triggers `onSubmit` only on `Cmd+Enter` or `Ctrl+Enter`
- `modelLabel` falls back to the raw `currentModel` string if no matching label found in `MODELS_BY_TASK`

---

## `useFileAttachment(onContent, maxChars): UseFileAttachmentReturn`

**File**: `src/hooks/use-file-attachment.ts`
**Contract**:

```typescript
export type OnFileContent = (content: string, fileName: string) => void

export interface UseFileAttachmentReturn {
  readonly attachedFileName: string | null
  readonly fileInputRef: React.RefObject<HTMLInputElement>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: () => void
}
```

**Invariants**:
- `onFileChange` reads the selected file as text via FileReader; calls `onContent(content.slice(0, maxChars), file.name)` on success
- `onFileChange` resets `e.target.value` after reading to allow re-selecting the same file
- `removeFile` sets `attachedFileName` to `null` and calls `onContent('', '')` to clear the input
- If no file is selected, `onFileChange` is a no-op

---

## `resolveModel(fromBody, envVar, fallback): string`

**File**: `src/lib/api/resolve-model.ts`
**Contract**:

```typescript
export function resolveModel(
  fromBody: string | undefined,
  envVar: string | undefined,
  fallback: string,
): string
```

**Invariants**:
- Returns `fromBody.trim()` if non-empty after trim
- Returns `envVar.trim()` if non-empty after trim and `fromBody` was empty/undefined
- Returns `fallback` otherwise
- Pure function — no side effects

---

## `ModelConfig` + accessor functions

**File**: `src/lib/config/model-config.ts`
**Contract**:

```typescript
export interface ModelConfig {
  analystModel: string
  explainModel: string
  testModel: string
  refactorModel: string
  commitModel: string
  translateModel: string
  ollamaBaseUrl: string
}

export function loadModelConfig(): ModelConfig
// Returns stored config merged with DEFAULTS; falls back to DEFAULTS on SSR or parse error

export function getModelForTask(config: ModelConfig, task: TaskType): string
// Returns config[TASK_MODEL_KEY[task]]

export function getAnalystModel(config: ModelConfig): string
export function getTranslateModel(config: ModelConfig): string
```

**Invariants**:
- `loadModelConfig` is safe to call in SSR (returns `DEFAULTS` when `window` is undefined)
- `loadModelConfig` merges stored values over `DEFAULTS`, so new keys always have defaults
- All getters are pure functions

---

## Decomposed `route.ts` internal functions

**File**: `src/pages/api/route.ts`
**Visibility**: module-scoped (not exported — internal orchestration only)

```typescript
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
// Handles primary stream + token-limit continuation + timeout + cost emission
```

**Invariants**:
- Each `emit*` function emits exactly the routing steps documented in the original `buildSSEStream`
- `streamSpecialistResponse` handles abort (emits `interrupted`), errors (emits `error`), and normal completion (emits `done` + `cost`)
- The 5-minute timeout (300_000 ms) is set inside `streamSpecialistResponse`, not in the orchestrator
