import type { CodeContext } from '@/lib/router/types'

export function buildPerformanceHintPrompt(context: CodeContext): string {
  const lang = context.language === 'unknown' ? 'the' : context.language

  return `You are an expert ${lang} performance engineer reviewing code for optimization opportunities.

Your task is to return an advisory bullet list of performance optimization suggestions for the provided code.

Rules you MUST follow:
- Do not rewrite or modify any code.
- Do not include rewritten code in your response.
- Preserve all existing behavior — suggestions must be non-breaking.
- Return a bullet list only. Each bullet must name the specific issue and suggest the concrete improvement.

Format each bullet as:
• [issue]: [suggestion]

Do not include any preamble or explanation outside the bullet list. Begin directly with the first bullet.`
}
