import type { DetectedLanguage } from './types'

interface LanguageRule {
  language: string
  patterns: RegExp[]
}

const HIGH_CONFIDENCE_SCORE = 3
const MEDIUM_CONFIDENCE_SCORE = 2
const SAMPLE_SIZE = 2000
const UNKNOWN_LANGUAGE = 'unknown'

// Ordered from more specific to more general so equal-score ties pick the
// More specific language: TypeScript before JavaScript, C++ before C, etc.
const RULES: LanguageRule[] = [
  {
    language: 'TypeScript',
    patterns: [
      /\binterface\s+\w+/,
      /:\s*(string|number|boolean|void|any|unknown|never)\b/,
      /\btype\s+\w+\s*=/,
      /<[A-Z]\w*>/,
      /\bas\s+(string|number|boolean|any)\b/,
    ],
  },
  {
    language: 'Python',
    patterns: [/\bdef\s+\w+\s*\(/, /\bimport\s+\w+/, /\bfrom\s+\w+\s+import\b/, /:\s*\n\s+/, /\bprint\s*\(/],
  },
  {
    language: 'Rust',
    patterns: [/\bfn\s+\w+\s*\(/, /\blet\s+mut\b/, /\bprintln!\s*\(/, /->\s*\w+/, /\bimpl\s+\w+/],
  },
  {
    language: 'Go',
    patterns: [/\bpackage\s+\w+/, /\bfunc\s+\w+\s*\(/, /\bfmt\.\w+\s*\(/, /:=\s*/],
  },
  {
    language: 'Java',
    patterns: [
      /\bpublic\s+class\s+\w+/,
      /\bSystem\.out\.print/,
      /\bString\[\]\s+args\b/,
      /\bpublic\s+static\s+void\s+main\b/,
    ],
  },
  {
    language: 'Kotlin',
    patterns: [/\bfun\s+\w+\s*\(/, /\bval\s+\w+\s*=/, /\bvar\s+\w+\s*:/, /\bprintln\s*\(/],
  },
  {
    language: 'Swift',
    patterns: [/\bimport\s+Foundation\b/, /\bimport\s+UIKit\b/, /\bfunc\s+\w+\s*\(.*\)\s*->/, /\bvar\s+\w+\s*:/],
  },
  {
    language: 'Ruby',
    patterns: [/\bdef\s+\w+/, /\bend\b/, /\bputs\s+/, /\brequire\s+['"]/, /do\s*\|/],
  },
  {
    language: 'C++',
    patterns: [/#include\s*<\w+>/, /\bstd::\w+/, /\bcout\s*<</, /\bnamespace\s+\w+/],
  },
  {
    language: 'C',
    patterns: [/#include\s*<stdio\.h>/, /#include\s*<stdlib\.h>/, /\bprintf\s*\(/, /\bint\s+main\s*\(/],
  },
  {
    language: 'JavaScript',
    patterns: [/\bfunction\s+\w+\s*\(/, /\bconst\s+\w+\s*=/, /\blet\s+\w+\s*=/, /\bconsole\.\w+\s*\(/],
  },
]

export function detectLanguage(input: string): DetectedLanguage {
  if (isBlank(input)) {
    return unknownLanguage()
  }

  const scores = scoreLanguages(sampleInput(input), RULES)
  const topMatch = pickTopLanguage(scores)
  if (!topMatch) {
    return unknownLanguage()
  }

  return {
    confidence: confidenceFromScore(topMatch[1]),
    language: topMatch[0],
  }
}

function isBlank(input: string): boolean {
  return input.trim().length === 0
}

function sampleInput(input: string): string {
  return input.slice(0, SAMPLE_SIZE)
}

function unknownLanguage(): DetectedLanguage {
  return { confidence: 'low', language: UNKNOWN_LANGUAGE }
}

function scoreLanguages(sample: string, rules: LanguageRule[]): Map<string, number> {
  const scores = new Map<string, number>()
  for (const rule of rules) {
    const score = countMatches(sample, rule.patterns)
    if (score > 0) {
      scores.set(rule.language, score)
    }
  }
  return scores
}

function countMatches(sample: string, patterns: RegExp[]): number {
  let matched = 0
  for (const pattern of patterns) {
    if (pattern.test(sample)) {
      matched += 1
      if (matched >= HIGH_CONFIDENCE_SCORE) {
        return matched
      }
    }
  }
  return matched
}

function pickTopLanguage(scores: Map<string, number>): [string, number] | undefined {
  if (scores.size === 0) {
    return undefined
  }
  const sorted = [...scores.entries()].toSorted((elementA, elementB) => elementB[1] - elementA[1])
  return sorted[0]
}

function confidenceFromScore(score: number): DetectedLanguage['confidence'] {
  if (score >= HIGH_CONFIDENCE_SCORE) {
    return 'high'
  }
  if (score >= MEDIUM_CONFIDENCE_SCORE) {
    return 'medium'
  }
  return 'low'
}
