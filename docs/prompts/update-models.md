# Prompt: Update SLM Models for Ollama

Use this prompt with an AI assistant that has web-search capability to refresh the available SLM (Small Language Model) options in the model registry.

---

## Instructions for the AI

You are a maintenance assistant for the SLM Router project. Your task is to research the latest and best small language models available on Ollama and update the model registry.

### Context

The model registry is split into separate files under `src/lib/router/models/`. Each file owns one category:

| File                                 | Exports                                                                               | Task                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------------- |
| `src/lib/router/models/explain.ts`   | `EXPLAIN_MODELS`, `DEFAULT_EXPLAIN_MODEL`                                             | Code explanation, documentation               |
| `src/lib/router/models/test.ts`      | `TEST_MODELS`, `DEFAULT_TEST_MODEL`                                                   | Test generation (Vitest, pytest, etc.)        |
| `src/lib/router/models/refactor.ts`  | `REFACTOR_MODELS`, `DEFAULT_REFACTOR_MODEL`                                           | Code cleanup, idiomatic rewrites              |
| `src/lib/router/models/commit.ts`    | `COMMIT_MODELS`, `DEFAULT_COMMIT_MODEL`                                               | Conventional commit message generation        |
| `src/lib/router/models/analyst.ts`   | `ANALYST_MODELS`, `DEFAULT_ANALYST_MODEL`                                             | Routing intelligence (JSON classification)    |
| `src/lib/router/models/translate.ts` | `TRANSLATE_MODELS`, `DEFAULT_TRANSLATE_MODEL`                                         | Translation (dedicated translation SLMs only) |
| `src/lib/router/models/index.ts`     | Re-exports everything + `MODELS_BY_TASK`, `DEFAULT_MODELS`, `OLLAMA_BASE_URL_DEFAULT` | Barrel — do not add models here               |

All files import `ModelOption` from `'../types'` (i.e. `src/lib/router/types.ts`).

Current defaults:

| Task       | Default model    |
| ---------- | ---------------- |
| `explain`  | phi3.5           |
| `test`     | qwen2.5-coder:7b |
| `refactor` | qwen2.5-coder:7b |
| `commit`   | phi3.5           |
| analyst    | llama3.2:1b      |
| translate  | icky/translate   |

### Step 1 — Web search

Search for:

- "best small language models for code 2025 Ollama"
- "Ollama models code generation" → look at `ollama.com/library` or `ollama.com/search?c=code`
- "qwen2.5-coder latest ollama" (check for newer versions like 3.x)
- "phi4 ollama code" / "phi3.5 replacement"
- "deepseek-coder-v2 ollama" / "deepseek-r2"
- "codellama newer alternatives"
- "ollama translation models" → `ollama.com/search?c=translation` for translate.ts updates

### Step 2 — Evaluate candidates

For each candidate model, note:

- Model ID (as used in `ollama pull <id>`)
- Parameter count (1B, 3B, 7B, 14B…)
- Disk size (e.g. 4.7 GB)
- Strengths (explanation, test gen, refactoring, commit messages, translation)
- Context window (important for refactoring long files)

Prefer models that:

- Are ≤ 14B parameters (fast enough for interactive use on a laptop)
- Have a task-specific fine-tune where available (e.g. `*-coder` or `*-translate` variants)
- Are available on Ollama without special access
- Have been released or significantly updated in the last 6 months

For **translate.ts** specifically:

- Only include models purpose-built or fine-tuned for translation
- Never add general-purpose LLMs to `TRANSLATE_MODELS`
- Code blocks are always extracted client-side before sending to these models (the model only ever sees prose)

### Step 3 — Update the correct file

Edit **only the file(s)** that correspond to the task category you are updating. For each model array:

1. Add new high-quality models that fit the task
2. Remove models that have been superseded (keep them if still popular, just move to bottom)
3. Update the `DEFAULT_*` export in that file if a better default exists (prefer smaller models that are still high-quality)
4. Ensure each model entry has:
   - `id`: exact Ollama pull ID (e.g. `qwen2.5-coder:7b`)
   - `label`: human-readable name (e.g. `Qwen 2.5 Coder 7B`)
   - `params`: parameter count string (e.g. `7B`)
   - `size`: disk size string (e.g. `4.7 GB`)
   - `description`: one sentence about why this model suits the task

You do **not** need to touch `src/lib/router/models/index.ts` unless you are adding a completely new category — it only re-exports from the category files.

### Step 4 — Verify

After editing, run:

```bash
pnpm typecheck
pnpm build
```

Confirm the build passes with zero errors.

### Output

Reply with:

- A summary of models added, removed, or promoted to default (grouped by file)
- Notes on context window improvements (important for refactor task truncation fixes)
- Any Ollama-specific pull commands users should run to get the new defaults
