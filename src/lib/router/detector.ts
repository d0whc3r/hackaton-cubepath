import type { DetectedLanguage } from './types'

interface LanguageRule {
  language: string
  patterns: RegExp[]
}

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
  if (!input.trim()) {
    return { confidence: 'low', language: 'unknown' }
  }

  const scores = new Map<string, number>()

  for (const rule of RULES) {
    let matchCount = 0
    for (const pattern of rule.patterns) {
      if (pattern.test(input)) {
        matchCount++
      }
    }
    if (matchCount > 0) {
      scores.set(rule.language, matchCount)
    }
  }

  if (scores.size === 0) {
    return { confidence: 'low', language: 'unknown' }
  }

  const sorted = [...scores.entries()].toSorted((elementA, elementB) => elementB[1] - elementA[1])
  const [[language, topScore]] = sorted

  const confidence: DetectedLanguage['confidence'] = topScore >= 3 ? 'high' : topScore >= 2 ? 'medium' : 'low'

  return { confidence, language }
}
