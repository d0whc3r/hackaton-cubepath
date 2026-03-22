# Quickstart: Code Quality & Refactor

**Branch**: `002-code-quality-refactor`

---

## Prerequisites

```bash
git checkout 002-code-quality-refactor
pnpm install
pnpm test          # baseline — all should pass
pnpm lint          # baseline — zero warnings
pnpm build         # baseline — succeeds
```

---

## Slice 0: React Compiler Setup

```bash
# 1. Install the compiler
pnpm add -D babel-plugin-react-compiler

# 2. Update astro.config.ts — add babel option to react()
#    See plan.md Slice 0 for exact diff

# 3. Update vitest.config.ts — add babel option to react()
#    See plan.md Slice 0 for exact diff

# 4. Add complexity rule to oxlint.config.ts
#    { "rules": { "complexity": ["error", 5] } }

# 5. Remove ALL useCallback / useMemo calls across the codebase
#    Search: grep -rn "useCallback\|useMemo" src/

# 6. Verify
pnpm build         # must succeed
pnpm test          # must pass
pnpm lint          # must pass (including new complexity rule)
```

---

## Slice 1: Components + Hooks

```bash
# 1. Create src/lib/config/model-config.ts
#    Move: ModelConfig, DEFAULTS, STORAGE_KEY, TASK_MODEL_KEY,
#           loadModelConfig, getModelForTask, getAnalystModel, getTranslateModel

# 2. Create src/hooks/use-chat-session.ts
#    Extract from ChatContainer: state, effect, mutation, all handlers

# 3. Create src/hooks/use-chat-input.ts
#    Extract from ChatInput: displayTask, charCount, overLimit, modelLabel, onSubmit, onKeyDown

# 4. Create src/hooks/use-file-attachment.ts
#    Extract from ChatInput: attachedFileName, fileInputRef, onFileChange, removeFile

# 5. Simplify ChatContainer — context provider + composition only
# 6. Simplify ChatInput — pure rendering consuming hook returns
# 7. Simplify ModelConfigDialog — component only, update all imports

# 8. Write new tests
#    src/__tests__/hooks/use-chat-session.test.ts
#    src/__tests__/hooks/use-chat-input.test.ts
#    src/__tests__/hooks/use-file-attachment.test.ts
#    src/__tests__/lib/config/model-config.test.ts

# 9. Comment hygiene on all src/components/ files

# 10. Verify
pnpm test && pnpm lint && pnpm build
```

---

## Slice 2: Lib Layer

```bash
# 1. Update src/lib/router/analyst.ts
#    Replace inline createOpenAI() with imported ollamaClient from src/lib/api/sse.ts

# 2. Comment hygiene pass:
#    src/lib/router/detector.ts
#    src/lib/router/specialists.ts
#    src/lib/utils/format.ts, history.ts, savings.ts
#    src/lib/prompts/*.ts

# 3. Add "why" documentation in src/lib/api/sse.ts (Adapter pattern, stream close guarantee)

pnpm test && pnpm lint && pnpm build
```

---

## Slice 3: API Route Handlers

```bash
# 1. Create src/lib/api/resolve-model.ts
#    Extract resolveModel function + write tests

# 2. Decompose src/pages/api/route.ts
#    Extract: emitLanguageDetection, emitTaskAnalysis,
#              emitSpecialistSelection, streamSpecialistResponse

# 3. Update src/pages/api/translate.ts
#    Use resolveModel from src/lib/api/resolve-model.ts

# 4. Comment hygiene on both API routes

pnpm test && pnpm lint && pnpm build
```

---

## Slice 4: Astro Pages + Final Audit

```bash
# 1. Comment hygiene on all .astro files
# 2. Final complexity check
grep -rn "useCallback\|useMemo" src/  # should return 0 results

pnpm test && pnpm lint && pnpm build

# Done — update checklists/requirements.md
```

---

## Key Commands Reference

```bash
pnpm test                          # run all tests
pnpm test --reporter=verbose       # verbose test output
pnpm lint                          # oxlint check
pnpm lint:fix                      # auto-fix lint issues
pnpm build                         # full Astro build (type-check + bundle)
pnpm dev                           # dev server for manual verification

# Find remaining manual memoisation
grep -rn "useCallback\|useMemo" src/ --include="*.ts" --include="*.tsx"

# Find remaining noise comments (heuristic — review each result)
grep -rn "// [A-Z][a-z]" src/ --include="*.ts" --include="*.tsx"
```
