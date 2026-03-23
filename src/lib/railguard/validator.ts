import type { RailguardRule, ValidationResult } from './types'

import { RAILGUARD_RULES } from './rules'

/**
 * Validates a single user input string against all active railguard rules.
 *
 * Short-circuit behaviour: evaluation stops at the FIRST matched rule.
 * Only rules with status "active" are evaluated — inactive rules are skipped entirely.
 *
 * Fail-closed: if any internal error occurs during evaluation, the function returns
 * { decision: "blocked" } rather than throwing. This prevents a broken rule from
 * accidentally permitting malicious input.
 *
 * @param input - The raw user input string to validate.
 * @param rules - Optional rule override; defaults to RAILGUARD_RULES. Use this in
 *                tests to pass a small subset of rules without affecting the registry.
 */
export function validateInput(input: string, rules: RailguardRule[] = RAILGUARD_RULES): ValidationResult {
  try {
    for (const rule of rules) {
      if (rule.status !== 'active') {
        continue
      }

      for (const pattern of rule.patterns) {
        if (pattern.test(input)) {
          return {
            attackVectorCategory: rule.category,
            blockReason: rule.description,
            decision: 'blocked',
            matchedRuleId: rule.id,
          }
        }
      }
    }

    return {
      attackVectorCategory: null,
      blockReason: null,
      decision: 'allowed',
      matchedRuleId: null,
    }
  } catch {
    // Fail-closed: any unexpected error results in a block (FR-007)
    return {
      attackVectorCategory: null,
      blockReason: 'Internal validation error — input blocked for safety.',
      decision: 'blocked',
      matchedRuleId: null,
    }
  }
}
