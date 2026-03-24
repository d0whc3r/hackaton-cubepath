/**
 * Analyst; a small, fast model that classifies code metadata before routing.
 *
 * Responsibilities (replaces TypeScript if/else heuristics):
 *  • Detect programming language
 *  • Select the appropriate test framework for the detected language
 *  • Detect whether input is a git diff
 *
 * Falls back to the regex-based detector if the model call fails or times out.
 */

import { generateText } from 'ai'
import { ollamaClient } from '@/lib/api/sse'
import { buildAnalystSystemPrompt, buildAnalystUserPrompt } from '@/lib/prompts/analyst'
import type { CodeContext, TaskType } from './types'
import { detectLanguage } from './detector'

// 8 seconds balances cold-start latency for local models with user experience;
// Fast enough to feel responsive, long enough for a first-run model load
const ANALYST_TIMEOUT_MS = 8000

export async function runAnalyst(
  input: string,
  taskType: TaskType,
  analystModelId: string,
  baseUrl: string,
): Promise<CodeContext> {
  // Ollama exposes an OpenAI-compatible /v1 endpoint; ollamaClient wraps it via
  // The OpenAI SDK (Adapter pattern), avoiding a separate Ollama SDK dependency
  const ollama = ollamaClient(baseUrl)

  const { text } = await generateText({
    abortSignal: AbortSignal.timeout(ANALYST_TIMEOUT_MS),
    model: ollama(analystModelId),
    prompt: buildAnalystUserPrompt(taskType, input),
    system: buildAnalystSystemPrompt(),
  })

  // Model may wrap JSON in ```json ... ```; extract the bare object
  const jsonMatch = /\{[\s\S]*?\}/.exec(text)
  if (!jsonMatch) {
    throw new Error('Analyst returned no JSON')
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<{
    language: string
    confidence: string
    testFramework: string | null
    isDiff: boolean
  }>

  return {
    confidence: isConfidence(parsed.confidence) ? parsed.confidence : 'low',
    isDiff: parsed.isDiff === true,
    language: typeof parsed.language === 'string' && parsed.language ? parsed.language : 'unknown',
    testFramework: typeof parsed.testFramework === 'string' ? parsed.testFramework : null,
  }
}

/** Fallback when Analyst model is unavailable or times out */
export function fallbackAnalysis(input: string): CodeContext {
  const detected = detectLanguage(input)
  return {
    confidence: detected.confidence,
    isDiff: /^diff --git|^@@\s/.test(input.trimStart()),
    language: detected.language,
    testFramework: defaultFramework(detected.language),
  }
}

function defaultFramework(language: string): string | null {
  const map: Record<string, string> = {
    go: 'the built-in testing package',
    java: 'JUnit',
    javascript: 'Vitest',
    kotlin: 'JUnit',
    python: 'pytest',
    ruby: 'RSpec',
    rust: 'the built-in test attribute',
    typescript: 'Vitest',
  }
  return map[language.toLowerCase()] ?? null
}

function isConfidence(val: unknown): val is CodeContext['confidence'] {
  return val === 'high' || val === 'medium' || val === 'low'
}
