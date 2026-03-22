import { route } from '@/lib/router/index'
import { buildSpecialists } from '@/lib/router/specialists'

const specialists = buildSpecialists({
  codeModel: 'qwen2.5-coder:7b',
  explainModel: 'phi3.5',
})

describe('route', () => {
  it('routes explain task to explanation-specialist', () => {
    const decision = route('explain', 'function add(a, b) { return a + b; }', specialists)
    expect(decision.specialist.id).toBe('explanation-specialist')
  })

  it('routes test task to test-specialist', () => {
    const decision = route('test', 'function add(a, b) { return a + b; }', specialists)
    expect(decision.specialist.id).toBe('test-specialist')
  })

  it('routes refactor task to refactor-specialist', () => {
    const decision = route('refactor', 'function add(a, b) { return a + b; }', specialists)
    expect(decision.specialist.id).toBe('refactor-specialist')
  })

  it('routes commit task to commit-specialist', () => {
    const decision = route('commit', 'diff --git a/f.ts b/f.ts\n+const x = 1;', specialists)
    expect(decision.specialist.id).toBe('commit-specialist')
  })

  it('includes detected language in decision', () => {
    const decision = route('explain', 'const x: number = 42;', specialists)
    expect(decision.detectedLanguage).toBeDefined()
    expectTypeOf(decision.detectedLanguage.language).toBeString()
  })

  it('detects TypeScript language in decision', () => {
    const decision = route('explain', 'interface Foo { bar: string }', specialists)
    expect(decision.detectedLanguage.language).toBe('TypeScript')
  })

  it('includes systemPrompt in decision', () => {
    const decision = route('explain', 'function add(a, b) { return a + b; }', specialists)
    expectTypeOf(decision.systemPrompt).toBeString()
    expect(decision.systemPrompt.length).toBeGreaterThan(0)
  })

  it('includes routingReason in decision', () => {
    const decision = route('explain', 'function add(a, b) { return a + b; }', specialists)
    expectTypeOf(decision.routingReason).toBeString()
    expect(decision.routingReason.length).toBeGreaterThan(0)
  })
})
