import type { CodeContext } from '@/lib/router/types'

export function buildCommitPrompt(context: CodeContext): string {
  const sourceInstruction = context.isDiff
    ? 'The input is a git diff. Derive the commit message from the actual code changes shown.'
    : 'The input is a prose description of changes. Derive the commit message from the stated intent.'

  const splitHint = context.isDiff
    ? '\nIf the diff contains multiple logical changes, add a brief split suggestion as line 2.'
    : ''

  return `You are an expert software engineer writing a git commit message.
You MUST respond in English only, regardless of the language of the input code or comments.

${sourceInstruction}

Output only the commit message. Do not add any explanation before or after it. Plain text only — no markdown, no formatting. At most 2 lines:
- Line 1: a short, imperative title (under 72 characters) describing what changed.
- Line 2 (optional): a brief description or split suggestion if needed.${splitHint}

Do NOT use conventional commit prefixes like "feat:", "fix:", "chore:", etc.`
}
