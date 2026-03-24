import { generateText } from 'ai'
import type { TaskType } from '@/lib/schemas/route'
import { ollamaClient } from '@/lib/api/sse'
import type { ValidationResult } from './types'
import { GUARD_PROMPTS } from './guard-prompts'

/**
 * Default guard model: smallest/fastest available Ollama model.
 * Can be overridden per-request via the `guardModel` field in the request body,
 * or at deploy time via the OLLAMA_GUARD_MODEL environment variable.
 */
export const DEFAULT_GUARD_MODEL = 'qwen2.5:0.5b'

/**
 * Maximum time (ms) to wait for the guard model to respond.
 * Fail-open on timeout; static rules already ran and caught obvious attacks.
 */
const GUARD_TIMEOUT_MS = 3000

/**
 * Semantic guard: asks a small, fast AI model whether the input is a legitimate
 * request for the given task type.
 *
 * Called AFTER the static regex rules pass. It is a complementary layer;
 * it catches inputs that bypass keyword filters but are semantically off-topic
 * (e.g. sending a poem to the "explain code" endpoint).
 *
 * Fail-open behaviour: if the guard model is unavailable, times out, or returns
 * an ambiguous answer, the input is allowed through. The static layer is the
 * authoritative security gate; the semantic layer is a best-effort enhancement.
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
  guardModel = DEFAULT_GUARD_MODEL,
): Promise<ValidationResult> {
  try {
    const ollama = ollamaClient(ollamaBaseUrl)

    const { text } = await generateText({
      abortSignal: AbortSignal.timeout(GUARD_TIMEOUT_MS),
      maxTokens: 10,
      model: ollama(guardModel),
      prompt: input,
      system: GUARD_PROMPTS[taskType],
    })

    // Parse the binary answer from the model output.
    // Accept "NO" / "No" / "no" anywhere in the response; require absence of "YES".
    // Anything ambiguous (no clear YES or NO) → fail-open (allow through).
    const normalised = text.trim().toLowerCase()
    const hasNo = /\bno\b/.test(normalised)
    const hasYes = /\byes\b/.test(normalised)

    if (hasNo && !hasYes) {
      return {
        attackVectorCategory: 'semantic-check',
        blockReason: `Your message doesn't look like a "${taskType}" request. Try sending content that matches the selected task; for example, a code snippet or a description of what you want to ${taskType}.`,
        decision: 'blocked',
        matchedRuleId: `semantic-guard-${taskType}`,
      }
    }

    return { attackVectorCategory: null, blockReason: null, decision: 'allowed', matchedRuleId: null }
  } catch {
    // Fail-open: model unavailable, timeout, or unexpected error.
    // Static rules are the authoritative security layer.
    return { attackVectorCategory: null, blockReason: null, decision: 'allowed', matchedRuleId: null }
  }
}
