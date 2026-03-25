# Prompt: Update SLM Models for Ollama

Use this prompt with an AI assistant that has web-search capability to refresh the available SLM (Small Language Model) options in the model registry.

---

## Context

This is a **SLM Router** project. Every model in every file must be either:

- A **code-specialist SLM** (fine-tuned on code: `*-coder`, `granite-code`, `devstral`, `deepseek-coder*`, `starcoder*`)
- A **task-specific SLM** (purpose-built for a single task: `tavernari/git-commit-message`, `translategemma`)
- A **small reasoning model** with strong structured-output support (for `analyst.ts` only: `llama3.2`, `phi4-mini`, `qwen2.5`)

**Never add** general-purpose chat models (raw `qwen3`, `gemma3`, `llama3.x` base, `phi4` 14B) to code-task files. They exist in the codebase as fallbacks only in `analyst.ts`.

---

## Model Registry Structure

The registry is split into 12 files under `src/lib/router/models/`. Each file owns one task category:

| File                                        | Exports                                                                               | Task                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/lib/router/models/explain.ts`          | `EXPLAIN_MODELS`, `DEFAULT_EXPLAIN_MODEL`                                             | Code explanation, documentation, walkthroughs                         |
| `src/lib/router/models/error-explain.ts`    | `ERROR_EXPLAIN_MODELS`, `DEFAULT_ERROR_EXPLAIN_MODEL`                                 | Stack trace analysis, root cause, fix suggestions                     |
| `src/lib/router/models/test.ts`             | `TEST_MODELS`, `DEFAULT_TEST_MODEL`                                                   | Test generation (Vitest, pytest, Jest, etc.)                          |
| `src/lib/router/models/refactor.ts`         | `REFACTOR_MODELS`, `DEFAULT_REFACTOR_MODEL`                                           | Code cleanup, idiomatic rewrites, large-file edits                    |
| `src/lib/router/models/docstring.ts`        | `DOCSTRING_MODELS`, `DEFAULT_DOCSTRING_MODEL`                                         | Docstring and JSDoc generation                                        |
| `src/lib/router/models/naming-helper.ts`    | `NAMING_HELPER_MODELS`, `DEFAULT_NAMING_HELPER_MODEL`                                 | Variable/function rename suggestions                                  |
| `src/lib/router/models/dead-code.ts`        | `DEAD_CODE_MODELS`, `DEFAULT_DEAD_CODE_MODEL`                                         | Unused symbol and unreachable branch detection                        |
| `src/lib/router/models/type-hints.ts`       | `TYPE_HINTS_MODELS`, `DEFAULT_TYPE_HINTS_MODEL`                                       | Type annotation and signature generation                              |
| `src/lib/router/models/performance-hint.ts` | `PERFORMANCE_HINT_MODELS`, `DEFAULT_PERFORMANCE_HINT_MODEL`                           | Bottleneck detection and optimisation suggestions                     |
| `src/lib/router/models/commit.ts`           | `COMMIT_MODELS`, `DEFAULT_COMMIT_MODEL`                                               | Conventional commit message generation                                |
| `src/lib/router/models/analyst.ts`          | `ANALYST_MODELS`, `DEFAULT_ANALYST_MODEL`                                             | Routing intelligence (JSON classification, runs before every request) |
| `src/lib/router/models/translate.ts`        | `TRANSLATE_MODELS`, `DEFAULT_TRANSLATE_MODEL`                                         | Text translation (dedicated translation SLMs only)                    |
| `src/lib/router/models/index.ts`            | Re-exports everything + `MODELS_BY_TASK`, `DEFAULT_MODELS`, `OLLAMA_BASE_URL_DEFAULT` | Barrel — do not add models here                                       |

All files import `ModelOption` from `'../types'` (i.e. `src/lib/router/types.ts`).

### Current defaults (as of 2026-03-25)

| Task               | Default model                       | Why                                                        |
| ------------------ | ----------------------------------- | ---------------------------------------------------------- |
| `explain`          | `qwen2.5-coder:7b`                  | Code-specialist with strong instruction following          |
| `error-explain`    | `qwen2.5-coder:7b`                  | Understands runtime semantics and framework internals      |
| `test`             | `qwen2.5-coder:7b`                  | Top performer on HumanEval-style test generation           |
| `refactor`         | `granite-code:8b`                   | 125K context avoids truncation on full-file rewrites       |
| `docstring`        | `qwen2.5-coder:3b`                  | Fast and accurate for single-function docstrings           |
| `naming-helper`    | `qwen2.5-coder:3b`                  | Convention-aware, tiny footprint                           |
| `dead-code`        | `granite-code:8b`                   | 125K context reduces false positives across files          |
| `type-hints`       | `qwen2.5-coder:7b`                  | Understands generics, union types, narrowing               |
| `performance-hint` | `granite-code:8b`                   | 125K context to read the full hot path                     |
| `commit`           | `tavernari/git-commit-message:mini` | Purpose-built, two-stage pipeline, 256K fits monorepos     |
| `analyst`          | `qwen2.5:0.5b`                      | Minimal RAM, fast, good JSON adherence with `format: json` |
| `translate`        | `translategemma:4b`                 | Google's dedicated 55-language translation model           |

---

## Step 1 — Web search

Search for:

- `ollama.com/library` — browse the full model catalogue
- `ollama.com/search?c=code` — filter by code category
- `ollama.com/search?c=translation` — translation-specific models (for `translate.ts` only)
- "qwen2.5-coder latest version ollama 2025 2026" — check for newer minor releases
- "deepseek-coder-v3 ollama" — successor to deepseek-coder-v2
- "devstral newer version ollama" — Mistral agentic coding model updates
- "granite-code new version ibm ollama" — IBM code model updates
- "tavernari git-commit-message ollama" — purpose-built commit model updates
- "phi4-mini newer version ollama" — Microsoft reasoning SLM updates
- "ollama translation models 2025 2026" — dedicated translation SLM updates

---

## Step 2 — Evaluate candidates

For each candidate, note:

- **Model ID** — exact Ollama pull ID (e.g. `qwen2.5-coder:7b`)
- **Params** — parameter count string (e.g. `7B`, `16B`)
- **Size** — disk size string (e.g. 4.7)
- **Context window** — integer (e.g. `32768`, `131072`)
- **Strengths** — why it fits the specific task
- **Release / update date** — prefer models released or updated in the last 6 months

### Hard rules by category

**Code-task files** (`explain`, `error-explain`, `test`, `refactor`, `docstring`, `naming-helper`, `dead-code`, `type-hints`, `performance-hint`):

- Only include models that are **code-fine-tuned or purpose-built for software engineering**
- Families to look at: `qwen2.5-coder`, `qwen3-coder`, `granite-code`, `devstral`, `deepseek-coder-v2` / `v3`, `starcoder2`
- Context window matters most for `refactor`, `dead-code`, `performance-hint` — prefer ≥ 32K, ideal ≥ 128K
- Do **not** add `qwen3`, `gemma3`, `llama3.x`, `phi4` (14B), or other general chat models to these files

**`commit.ts`**:

- Prefer purpose-built commit models (`tavernari/git-commit-message`) first
- Fall back to code-specialist models (`qwen2.5-coder:*`) — never general chat models
- Keep models ≤ 8B for fast interactive use

**`analyst.ts`** (routing only):

- Models must be ≤ 4B — the analyst runs on every request before the main model
- Prefer models with strong JSON schema / structured-output support
- `qwen2.5:*`, `llama3.2:1b`, `phi4-mini:3.8b`, `granite3.3:2b` are all appropriate
- Do **not** add full code-specialist models here (they are too slow for pre-routing)

**`translate.ts`**:

- Only models **purpose-built for translation** — never general-purpose LLMs
- Code blocks are extracted client-side before the text reaches the model; the model only ever sees prose
- Current good options: `translategemma:4b`, `translategemma:12b`, `zongwei/gemma3-translator:*`
- Families to check: any `*-translate*` or `*translator*` models on `ollama.com/search?c=translation`

---

## Step 3 — Update the correct file

Edit **only the file(s)** that correspond to the category you are updating. For each model array:

1. Add new high-quality models that fit the task
2. Remove models that have been superseded — keep them if still widely used, but move them toward the bottom
3. Update the `DEFAULT_*` export if a better default exists — prefer smaller models that are still high-quality so the out-of-box experience is fast
4. Ensure every model entry has all six fields:
   - `id` — exact Ollama pull ID
   - `label` — human-readable name
   - `params` — parameter count string
   - `size` — disk size string
   - `description` — one sentence starting with `Vendor · why this model suits the task`
   - `contextWindow` — integer (number of tokens)

You do **not** need to touch `src/lib/router/models/index.ts` unless you are adding a completely new task category — it only re-exports from the category files.

---

## Step 4 — Verify

After editing, run:

```bash
pnpm typecheck
pnpm build
```

Confirm the build passes with zero errors.

---

## Step 5 — Report

Reply with:

- A summary of models **added**, **removed**, or **promoted to default** (grouped by file)
- For any context window improvement: note the old vs new window size (important for `refactor`, `dead-code`, `performance-hint` truncation)
- The `ollama pull` commands users must run to get the new defaults
