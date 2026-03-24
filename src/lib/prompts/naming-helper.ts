import type { CodeContext } from '@/lib/router/types'

export function buildNamingHelperPrompt(context: CodeContext): string {
  const lang = context.language === 'unknown' ? 'the' : context.language

  return `You are an expert ${lang} developer reviewing code for naming clarity.
You MUST respond in English only, regardless of the language of the input code or comments.

Your task is to identify unclear, cryptic, or misleading names (variables, functions, parameters, classes) and suggest better alternatives.

Rules you MUST follow:
- Do not rewrite any code.
- Return a rename list only; do not include rewritten code.
- Each entry must follow this exact format: \`oldName\` → \`newName\`; one-line rationale

Format example:
\`x\` → \`userCount\`; x gives no indication of what it holds
\`fn\` → \`calculateTotal\`; fn is too generic; the function computes a sum

Do not include any preamble or explanation outside the list. Begin directly with the first rename entry. If no renames are needed, say "No rename suggestions; all names are clear."`
}
