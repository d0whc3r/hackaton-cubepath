import { generateText } from 'ai'
import type { TaskType } from '@/lib/schemas/route'
import { ollamaClient } from '@/lib/api/sse'
import type { ValidationResult } from './types'
import { DEFAULT_GUARD_MODEL } from './guard-models'
import { GUARD_PROMPTS } from './guard-prompts'

const GUARD_TIMEOUT_MS = 5000
const STRICT_GUARD_SUFFIX = `Hard policy:
- Return NO for any non-software request (jokes, poems, recipes, travel, politics, personal chat).
- Return NO if the user request does not match the selected task.
- Return YES only for legitimate software-development requests for this task.
- If uncertain, return NO.
- Reply with exactly one token: YES or NO.`

function normaliseForGuard(input: string): string {
  return input.normalize('NFKC').replaceAll(/\s+/g, ' ').trim()
}

function parseGuardDecision(text: string): 'yes' | 'no' | 'ambiguous' {
  const normalised = text.trim().toLowerCase()
  if (normalised === 'yes') {
    return 'yes'
  }
  if (normalised === 'no') {
    return 'no'
  }
  const hasNo = /\bno\b/.test(normalised)
  const hasYes = /\byes\b/.test(normalised)
  if (hasNo && !hasYes) {
    return 'no'
  }
  if (hasYes && !hasNo) {
    return 'yes'
  }
  return 'ambiguous'
}

/**
 * Semantic guard: asks a small, fast AI model whether the input is a legitimate
 * request for the given task type.
 *
 * It blocks semantically off-topic requests for the selected task
 * (e.g. sending a poem to the "explain code" endpoint).
 *
 * Fail-closed behaviour: if the guard model is unavailable, times out, or returns
 * an ambiguous answer, the input is blocked.
 *
 * @param input        - The raw user input string.
 * @param taskType     - The task the user selected (e.g. "explain", "refactor").
 * @param ollamaBaseUrl - Ollama server base URL (e.g. "http://localhost:11434").
 * @param guardModel   - Model ID to use for classification. Default: qwen2.5:0.5b.
 */
export async function validateInputSemantic(
  input: string,
  taskType: TaskType,
  ollamaBaseUrl: string,
  guardModel: string = DEFAULT_GUARD_MODEL,
): Promise<ValidationResult> {
  const blocked: ValidationResult = {
    attackVectorCategory: 'semantic-check',
    blockReason: `Your message doesn't look like a "${taskType}" request. Try sending content that matches the selected task; for example, a code snippet or a description of what you want to ${taskType}.`,
    decision: 'blocked',
    matchedRuleId: `semantic-guard-${taskType}`,
  }

  try {
    const ollama = ollamaClient(ollamaBaseUrl)

    const guardInput = normaliseForGuard(input).slice(0, 500)
    const prompt = `User: "${guardInput}"\nAnswer:`

    const { text } = await generateText({
      abortSignal: AbortSignal.timeout(GUARD_TIMEOUT_MS),
      maxOutputTokens: 10,
      model: ollama(guardModel),
      prompt,
      system: `${GUARD_PROMPTS[taskType]}\n\n${STRICT_GUARD_SUFFIX}`,
      temperature: 0,
    })

    const decision = parseGuardDecision(text)
    if (decision !== 'yes') {
      return blocked
    }
  } catch {
    return blocked
  }
  return { attackVectorCategory: null, blockReason: null, decision: 'allowed', matchedRuleId: null }
}
