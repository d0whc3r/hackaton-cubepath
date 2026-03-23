/**
 * Analyst model prompts.
 *
 * The Analyst is a small, fast model that classifies code metadata before the
 * request reaches the main specialist. It replaces hard-coded TypeScript
 * if/else logic for language detection, test-framework selection, etc.
 */

export function buildAnalystSystemPrompt(): string {
  return (
    'You are a code metadata classifier. Your only job is to analyze a code snippet ' +
    'and return a single JSON object describing its metadata. ' +
    'Never add explanations, markdown, or any text outside the JSON. ' +
    'You MUST respond in English only.\n\n' +
    'Task type definitions:\n' +
    '- "explain": the user wants to understand what the code does\n' +
    '- "refactor": the user wants to improve code quality or structure\n' +
    '- "test": the user wants tests generated for the code\n' +
    '- "commit": the user wants a git commit message from a diff or prose description\n\n' +
    'Disambiguation rules:\n' +
    '- If the task is "explain", focus on detecting the programming language accurately\n' +
    '- If the task is "test", prioritize identifying the correct test framework for the language\n' +
    '- If the task is "commit", check whether the input starts with "diff --git" or contains "@@ " markers to set isDiff\n' +
    '- "refactor" and "explain" both receive code — distinguish by task type, not input shape'
  )
}

export function buildAnalystUserPrompt(taskType: string, input: string): string {
  // Only send a small sample — Analyst needs speed, not full context
  const sample = input.slice(0, 1500)

  return `Analyze this code snippet for a "${taskType}" task.

Respond with ONLY this JSON (no markdown, no explanation):
{
  "language": "<language or 'unknown'>",
  "confidence": "<'high'|'medium'|'low'>",
  "testFramework": "<framework or null>",
  "isDiff": <true|false>
}

Field rules:
- language: one of TypeScript, JavaScript, Python, Go, Rust, Java, Kotlin, Swift, Ruby, C, C++, or 'unknown'
- confidence: high (3+ strong patterns), medium (1-2 patterns), low (uncertain or ambiguous)
- testFramework: best testing framework for this language (Vitest for TypeScript/JavaScript, pytest for Python, Go testing package for Go, JUnit for Java/Kotlin, built-in test attribute for Rust, RSpec for Ruby, null if language is unknown); set to null for "commit" and "refactor" tasks
- isDiff: true if input starts with "diff --git" or contains "@@ " diff markers, false otherwise

Examples:
- "commit" task with input starting "diff --git a/src/foo.ts" → isDiff: true
- "commit" task with input "added null check to user validator" → isDiff: false
- "test" task with TypeScript code → testFramework: "Vitest"

Code:
\`\`\`
${sample}
\`\`\``
}
