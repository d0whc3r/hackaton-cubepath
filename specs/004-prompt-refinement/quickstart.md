# Quickstart: Verify Prompt Refinement

**Branch**: `004-prompt-refinement`

---

## Verification

### Run the test suite

```bash
pnpm test
```

Expected results after all changes:
- `specialists.test.ts` — all 26 tests pass (9 previously failing → now passing)
- `router.test.ts` — all 8 tests pass (8 previously failing → now passing)

---

## Manual verification per specialist

### explain

```typescript
import { buildExplainPrompt } from '@/lib/prompts/explain'

const prompt = buildExplainPrompt({ language: 'TypeScript', confidence: 'high', testFramework: 'Vitest', isDiff: false })

console.assert(prompt.toLowerCase().includes('plain text'), 'Must say plain text')
console.assert(/no markdown|without markdown|do not use markdown/i.test(prompt), 'Must forbid markdown')
console.assert(prompt.includes('What it does'), 'Section: What it does')
console.assert(prompt.includes('Why it works'), 'Section: Why it works')
console.assert(prompt.includes('Example'), 'Section: Example')
console.assert(prompt.includes('Risks'), 'Section: Risks')
console.assert(!prompt.toLowerCase().includes('refactor'), 'No refactor instructions')
```

### test (TypeScript)

```typescript
import { buildTestPrompt } from '@/lib/prompts/test'

const prompt = buildTestPrompt({ language: 'TypeScript', confidence: 'high', testFramework: 'Vitest', isDiff: false })

console.assert(prompt.toLowerCase().includes('plain text'), 'Must say plain text')
console.assert(prompt.includes('Vitest'), 'Must name Vitest')
console.assert(prompt.includes('Section 1'), 'Section 1 present')
console.assert(prompt.includes('Section 2'), 'Section 2 present')
```

### refactor

```typescript
import { buildRefactorPrompt } from '@/lib/prompts/refactor'

const prompt = buildRefactorPrompt({ language: 'TypeScript', confidence: 'high', testFramework: null, isDiff: false })

console.assert(prompt.toLowerCase().includes('plain text'), 'Must say plain text')
console.assert(/legib/i.test(prompt), 'Must say legibility')
console.assert(prompt.includes('Behavior preserved:'), 'Must have behavior note')
```

### commit (diff input)

```typescript
import { buildSpecialists } from '@/lib/router/specialists'

const specialists = buildSpecialists({ explainModel: 'm', testModel: 'm', refactorModel: 'm', commitModel: 'm' })
const mockLang = { language: 'TypeScript', confidence: 'high' as const }
const prompt = specialists.commit.buildSystemPrompt(mockLang, 'diff --git a/f.ts b/f.ts\n+const x = 1')

console.assert(prompt.toLowerCase().includes('diff'), 'Must say diff')
console.assert(prompt.toLowerCase().includes('code changes'), 'Must say code changes')
```

### route (sync)

```typescript
import { route } from '@/lib/router/index'
import { buildSpecialists } from '@/lib/router/specialists'

const specialists = buildSpecialists({ explainModel: 'm', testModel: 'm', refactorModel: 'm', commitModel: 'm' })
const decision = route('explain', 'const x: number = 42', specialists) // no await

console.assert(decision.specialist.id === 'explanation-specialist', 'Routes to explain specialist')
console.assert(typeof decision.detectedLanguage.language === 'string', 'detectedLanguage present')
console.assert(decision.detectedLanguage.language === 'TypeScript', 'Detects TypeScript')
```

---

## Skill references used

| Specialist | Skill(s) applied |
|-----------|-----------------|
| explain | `llm-prompt-optimizer` (RSCIT framework, output contract), `code-reviewer` (risk analysis) |
| refactor | `llm-prompt-optimizer`, `clean-code` (legibility-first), `architecture-patterns` |
| test | `llm-prompt-optimizer`, `javascript-testing-patterns` (AAA pattern, framework naming) |
| commit | `llm-prompt-optimizer` (plain text output, length constraint) |
| analyst | `llm-prompt-optimizer` (JSON structured output, disambiguation rules) |
