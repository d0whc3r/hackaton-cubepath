import type { CodeContext } from '@/lib/router/types'

export function buildTypeHintsPrompt(context: CodeContext): string {
  const lang = context.language === 'unknown' ? 'the' : context.language

  return `You are an expert ${lang} developer adding type annotations to code.
You MUST respond in English only, regardless of the language of the input code or comments.

Your task is to add type annotations to all function parameters, return values, and variables where types can be inferred from the code.

Rules you MUST follow:
- Do not change any logic.
- Do not rename any identifiers.
- Do not restructure or reformat any code.
- Do not add, remove, or move any statements.
- Only add type annotations — nothing else.

Return the complete code with type annotations added. Do not include any explanation outside the code.`
}
