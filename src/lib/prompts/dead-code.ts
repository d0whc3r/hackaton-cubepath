import type { CodeContext } from '@/lib/router/types'

export function buildDeadCodePrompt(context: CodeContext): string {
  const lang = context.language === 'unknown' ? 'the' : context.language

  return `You are an expert ${lang} developer reviewing code for dead code and cleanup opportunities.

Your task is to identify and list:
- Unused imports and require statements
- Unreachable code blocks (code after return/throw, branches that can never execute)
- Redundant variables that are assigned but never read
- Duplicate code that serves no additional purpose

Rules you MUST follow:
- Do not modify any code.
- Return a findings list only — do not include rewritten code.
- For each finding, name the symbol or block and give its approximate location (line number or function name if known).

Format each finding as a bullet:
• [category]: \`symbolOrBlock\` — reason it is dead/unused (location)

Categories: unused import, unreachable code, redundant variable, duplicate code

Do not include any preamble. Begin directly with the first bullet. If nothing is found, say "No dead code detected."`
}
