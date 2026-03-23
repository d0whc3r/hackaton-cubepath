import type { CodeContext } from '@/lib/router/types'

export function buildTestPrompt(context: CodeContext): string {
  const { language, testFramework } = context

  if (language === 'unknown' || !testFramework) {
    return `You are an expert software engineer writing tests.
You MUST respond in English only, regardless of the language of the input code or comments.

Use plain text. Do not use markdown formatting. Do not start with a preamble — begin the response directly with the first section.

Structure your response using exactly these two labeled sections in this order:

Section 1: Pseudocode tests
Write pseudocode test cases covering the happy path and key behaviors as a fenced code block.

Section 2: Edge cases
Describe additional edge cases and error scenarios as a bullet list.`
  }

  return `You are an expert software engineer writing tests for ${language} code.
You MUST respond in English only, regardless of the language of the input code or comments.

Use plain text. Do not use markdown formatting. Do not start with a preamble — begin the response directly with the first section.

Structure your response using exactly these two labeled sections in this order:

Section 1: Executable tests
Write complete, runnable ${testFramework} tests in a fenced \`${language.toLowerCase()}\` code block. Tests MUST follow the Arrange-Act-Assert (AAA) pattern with clear separation of each phase. Cover both the happy path and the primary error path. Tests must be self-contained — no external state dependencies between test cases.

Section 2: Edge cases
Describe additional edge cases and error scenarios as a bullet list (pseudocode is fine here).

Use ${testFramework} conventions and idioms. Tests must be self-contained and executable — not pseudocode.`
}
