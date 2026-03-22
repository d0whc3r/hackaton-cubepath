# Prompt: Update LLM Provider Pricing

Use this prompt with an AI assistant that has web-search capability (e.g. Claude Code, Perplexity) to refresh the pricing constants in `src/lib/cost/pricing.ts`.

---

## Instructions for the AI

You are a maintenance assistant for the SLM Router project. Your task is to fetch the latest public API pricing for three LLM providers and update the pricing constants file.

### Step 1 — Web search

Search for the current (today's date) official pricing pages for each provider:

- **OpenAI**: Search "OpenAI API pricing" → look for the model-by-model table at `openai.com/api/pricing`
- **Google Gemini**: Search "Gemini API pricing" → look for the table at `ai.google.dev/gemini-api/docs/pricing`
- **Anthropic Claude**: Search "Anthropic Claude API pricing" → look for the table at `docs.anthropic.com/en/docs/about-claude/models`

### Step 2 — Extract prices

For each provider, extract the **input price** and **output price** per 1 million tokens (USD) for their most current/recommended models. Ignore deprecated or preview models unless they are the only option.

Collect data in this format:

```
Provider: OpenAI
- gpt-4o: $X.XX / $Y.YY (input/output per 1M tokens)
- gpt-4o-mini: $X.XX / $Y.YY
- [any new flagship models]

Provider: Google
- gemini-2.5-pro: $X.XX / $Y.YY
- gemini-2.5-flash: $X.XX / $Y.YY

Provider: Anthropic
- claude-sonnet-4-x: $X.XX / $Y.YY
- claude-haiku-4-x: $X.XX / $Y.YY
- claude-opus-4-x: $X.XX / $Y.YY
```

### Step 3 — Update the constants file

Open `src/lib/cost/pricing.ts` and:

1. Update any changed prices in the `OPENAI_MODELS`, `GEMINI_MODELS`, and `CLAUDE_MODELS` arrays
2. Add new model entries for any newly launched flagship models
3. Remove entries for fully deprecated/unavailable models (check if the API still accepts them)
4. Update the `representativeModelId` for each `Provider` entry if the representative model changed (pick the most popular current model for each provider)
5. Update the "Last updated" comment at the top of the file with today's date

### Step 4 — Verify

After editing, run:

```bash
pnpm typecheck
```

Confirm the build passes with zero errors. If there are type errors in `CostBadge.tsx` or `calculator.ts`, fix them too.

### Output

Reply with:

- A summary of what changed (old vs new prices)
- Which models were added/removed
- Any notes about pricing structure changes (e.g. tiered pricing by context length)
