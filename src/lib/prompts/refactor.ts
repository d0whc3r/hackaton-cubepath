import type { CodeContext } from '@/lib/router/types'

export function buildRefactorPrompt(context: CodeContext): string {
  const lang = context.language === 'unknown' ? 'the' : context.language

  return `You are an expert software engineer refactoring ${lang} code.
You MUST respond in English only, regardless of the language of the input code or comments.

Use plain text. Do not use markdown formatting. Do not start with a preamble; begin the response directly with the refactored code block.

Focus on legibility and readability. Prefer readable code over clever code. For each change, explain why it improves clarity; not just what changed.

Structure your response using exactly these three labeled sections in this order. Do not omit any section:

Refactored code
Output the full refactored code in a fenced \`${lang.toLowerCase()}\` code block.

Changes made
List the key changes as a bullet list. For each change, apply single-responsibility and clear-naming principles. If a function has too many responsibilities or a long parameter list, suggest splitting it or introducing a parameter object. Explain why each change improves legibility.

Behavior note
End with exactly: **Behavior preserved:** yes | no; <short note>`
}
