import { buildSpecialists } from '@/lib/router/specialists'

const ENV = { codeModel: 'qwen2.5-coder:7b', explainModel: 'phi3.5' }
const specialists = buildSpecialists(ENV)

const mockLang = { confidence: 'high' as const, language: 'TypeScript' }

// US1; Explain specialist
describe('explanation-specialist', () => {
  it('has id explanation-specialist', () => {
    expect(specialists.explain.id).toBe('explanation-specialist')
  })

  it("buildSystemPrompt contains 'explain' and language name", () => {
    const prompt = specialists.explain.buildSystemPrompt(mockLang, 'function f(){}')
    expect(prompt.toLowerCase()).toContain('explain')
    expect(prompt).toContain('TypeScript')
  })

  it('buildSystemPrompt instructs plain text output with no markdown', () => {
    const prompt = specialists.explain.buildSystemPrompt(mockLang, 'function f(){}')
    expect(prompt.toLowerCase()).toContain('plain text')
    expect(prompt.toLowerCase()).toMatch(/no markdown|without markdown|do not use markdown/)
  })

  it('buildSystemPrompt mentions the four fixed sections', () => {
    const prompt = specialists.explain.buildSystemPrompt(mockLang, 'function f(){}')
    expect(prompt).toContain('What it does')
    expect(prompt).toContain('Why it works')
    expect(prompt).toContain('Example')
    expect(prompt).toContain('Risks')
  })

  it('buildSystemPrompt does NOT contain code transformation instructions', () => {
    const prompt = specialists.explain.buildSystemPrompt(mockLang, 'function f(){}')
    expect(prompt.toLowerCase()).not.toContain('refactor')
    expect(prompt.toLowerCase()).not.toContain('rewrite')
  })
})

// US2; Test specialist
describe('test-specialist', () => {
  it('has id test-specialist', () => {
    expect(specialists.test.id).toBe('test-specialist')
  })

  it('buildSystemPrompt for TypeScript instructs Vitest', () => {
    const prompt = specialists.test.buildSystemPrompt({ confidence: 'high', language: 'TypeScript' }, 'function f(){}')
    expect(prompt).toContain('Vitest')
  })

  it('buildSystemPrompt for Python instructs pytest', () => {
    const prompt = specialists.test.buildSystemPrompt({ confidence: 'high', language: 'Python' }, 'def f(): pass')
    expect(prompt).toContain('pytest')
  })

  it('buildSystemPrompt for unknown instructs pseudocode only', () => {
    const prompt = specialists.test.buildSystemPrompt({ confidence: 'low', language: 'unknown' }, 'lorem ipsum')
    expect(prompt.toLowerCase()).toContain('pseudocode')
    expect(prompt).not.toContain('Vitest')
    expect(prompt).not.toContain('pytest')
  })

  it('buildSystemPrompt specifies two output sections', () => {
    const prompt = specialists.test.buildSystemPrompt(mockLang, 'function f(){}')
    expect(prompt).toContain('Section 1')
    expect(prompt).toContain('Section 2')
  })

  it('buildSystemPrompt instructs plain text output', () => {
    const prompt = specialists.test.buildSystemPrompt(mockLang, 'function f(){}')
    expect(prompt.toLowerCase()).toContain('plain text')
  })
})

// US3; Refactor specialist
describe('refactor-specialist', () => {
  it('has id refactor-specialist', () => {
    expect(specialists.refactor.id).toBe('refactor-specialist')
  })

  it('buildSystemPrompt instructs plain text output', () => {
    const prompt = specialists.refactor.buildSystemPrompt(mockLang, 'function f(){}')
    expect(prompt.toLowerCase()).toContain('plain text')
  })

  it('buildSystemPrompt instructs legibility-first refactoring', () => {
    const prompt = specialists.refactor.buildSystemPrompt(mockLang, 'function f(){}')
    expect(prompt.toLowerCase()).toContain('legib')
  })

  it('buildSystemPrompt requires response to end with Behavior preserved line', () => {
    const prompt = specialists.refactor.buildSystemPrompt(mockLang, 'function f(){}')
    expect(prompt).toContain('Behavior preserved:')
  })

  it('buildSystemPrompt does NOT contain explanation-style instructions', () => {
    const prompt = specialists.refactor.buildSystemPrompt(mockLang, 'function f(){}')
    expect(prompt.toLowerCase()).not.toContain('what it does')
    expect(prompt.toLowerCase()).not.toContain('why it works')
  })
})

// US4; Commit specialist
describe('commit-specialist', () => {
  it('has id commit-specialist', () => {
    expect(specialists.commit.id).toBe('commit-specialist')
  })

  it('buildSystemPrompt for diff input detects diff and instructs deriving from code changes', () => {
    const prompt = specialists.commit.buildSystemPrompt(mockLang, 'diff --git a/f.ts b/f.ts\n+const x = 1;')
    expect(prompt.toLowerCase()).toContain('diff')
    expect(prompt.toLowerCase()).toContain('code changes')
  })

  it('buildSystemPrompt for diff input explicitly forbids conventional commit format', () => {
    const prompt = specialists.commit.buildSystemPrompt(mockLang, 'diff --git a/f.ts b/f.ts\n+const x = 1;')
    expect(prompt.toLowerCase()).toContain('not')
    expect(prompt.toLowerCase()).toMatch(/conventional commit|type prefix|feat:|fix:/)
  })

  it('buildSystemPrompt for diff input limits output to 2 lines max', () => {
    const prompt = specialists.commit.buildSystemPrompt(mockLang, 'diff --git a/f.ts b/f.ts\n+const x = 1;')
    expect(prompt).toContain('2 lines')
  })

  it('buildSystemPrompt for prose input detects prose and derives from described intent', () => {
    const prompt = specialists.commit.buildSystemPrompt(mockLang, 'added null check to user validator')
    expect(prompt.toLowerCase()).toContain('prose')
  })

  it('buildSystemPrompt for prose input also forbids conventional commit format', () => {
    const prompt = specialists.commit.buildSystemPrompt(mockLang, 'added null check to user validator')
    expect(prompt.toLowerCase()).toMatch(/conventional commit|type prefix|feat:|fix:/)
  })
})
