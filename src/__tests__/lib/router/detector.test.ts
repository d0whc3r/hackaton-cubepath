import { detectLanguage } from '@/lib/router/detector'

describe('detectLanguage', () => {
  it('detects TypeScript from interface keyword', () => {
    const result = detectLanguage('interface Foo { bar: string }')
    expect(result.language).toBe('TypeScript')
  })

  it('detects TypeScript from type annotation syntax', () => {
    const result = detectLanguage('const x: number = 42;')
    expect(result.language).toBe('TypeScript')
  })

  it('detects JavaScript from function keyword without types', () => {
    const result = detectLanguage('function add(a, b) { return a + b; }')
    expect(result.language).toBe('JavaScript')
  })

  it('detects Python from def keyword', () => {
    const result = detectLanguage("def greet(name):\n    return f'Hello {name}'")
    expect(result.language).toBe('Python')
  })

  it('detects Python from import keyword with indented block', () => {
    const result = detectLanguage('import os\nif True:\n    pass')
    expect(result.language).toBe('Python')
  })

  it('detects Rust from fn keyword with -> syntax', () => {
    const result = detectLanguage('fn main() -> () {\n    println!("hello");\n}')
    expect(result.language).toBe('Rust')
  })

  it('detects Go from package main', () => {
    const result = detectLanguage('package main\nfunc main() {}')
    expect(result.language).toBe('Go')
  })

  it('detects Java from public class', () => {
    const result = detectLanguage('public class Foo {\n  public static void main(String[] args) {}\n}')
    expect(result.language).toBe('Java')
  })

  it('detects C++ from #include with angle brackets', () => {
    const result = detectLanguage('#include <iostream>\nint main() { return 0; }')
    expect(result.language).toBe('C++')
  })

  it('detects Ruby from def keyword with end', () => {
    const result = detectLanguage('def greet(name)\n  puts name\nend')
    expect(result.language).toBe('Ruby')
  })

  it('detects Swift from import Foundation', () => {
    const result = detectLanguage('import Foundation\nfunc greet() -> String { return "hi" }')
    expect(result.language).toBe('Swift')
  })

  it('detects Kotlin from fun keyword', () => {
    const result = detectLanguage('fun main() {\n    println("Hello")\n}')
    expect(result.language).toBe('Kotlin')
  })

  it('returns unknown for unrecognized input', () => {
    const result = detectLanguage('lorem ipsum dolor sit amet')
    expect(result.language).toBe('unknown')
  })

  it('returns unknown for empty input', () => {
    expect(detectLanguage('')).toEqual({ confidence: 'low', language: 'unknown' })
  })

  it('returns a valid confidence level', () => {
    const result = detectLanguage('const x: number = 1;')
    expect(['high', 'medium', 'low']).toContain(result.confidence)
  })

  it('breaks ties toward the more specific language rule', () => {
    const result = detectLanguage('const value = input as string')
    expect(result.language).toBe('TypeScript')
  })

  it('returns low confidence for plain English prose', () => {
    expect(detectLanguage('This is a paragraph about programming concepts.')).toEqual({
      confidence: 'low',
      language: 'unknown',
    })
  })

  it('prefers TypeScript over JavaScript for mixed TS and JS signals', () => {
    const result = detectLanguage(`
      const x = 1
      interface Foo { bar: string }
      function baz(): void {}
    `)
    expect(result.language).toBe('TypeScript')
  })

  it('handles very long input without throwing', () => {
    expect(() => detectLanguage('x'.repeat(15_000))).not.toThrow()
  })
})
