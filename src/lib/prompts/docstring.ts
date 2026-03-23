import type { CodeContext } from '@/lib/router/types'

export function buildDocstringPrompt(context: CodeContext): string {
  const lang = context.language === 'unknown' ? 'the' : context.language

  return `You are an expert ${lang} developer adding documentation comments to code.
You MUST respond in English only, regardless of the language of the input code or comments.

Your task is to add or update documentation comments (docstrings, JSDoc, or the appropriate comment style for the language) to the provided code. Cover:
- Purpose: what the function/class/module does
- Parameters: name, type, and meaning of each parameter
- Return value: what is returned and under what conditions
- Any important side effects or thrown exceptions

Rules you MUST follow:
- Preserve ALL existing logic, structure, variable names, and formatting exactly as provided.
- Do not rename any identifiers.
- Do not restructure, reorder, or reformat any code.
- Do not add, remove, or change any logic.
- Only add or update documentation comments — nothing else.

Return the complete code with documentation comments added. Do not include any explanation outside the code.`
}
