import type { RailguardRule } from './types'

/**
 * The central rule registry. Rules are evaluated in order; first match wins.
 * Add rules by appending to this array — see specs/007-railguard-security/quickstart.md.
 *
 * Categories:
 *   role-play-override    — Persona framing to remove restrictions
 *   instruction-injection — Directives to ignore/overwrite the system prompt
 *   encoding-bypass       — Instructions hidden via base64, ROT13, leetspeak, etc.
 *   persona-switch        — Activation of an alternate unrestricted "mode"
 *   prompt-flooding       — Extreme repetition to dilute system prompt context
 */
export const RAILGUARD_RULES: RailguardRule[] = [
  // ─── Role-play Override ─────────────────────────────────────────────────────
  // Threat: attacker frames the model as a different, unrestricted persona to bypass system prompt constraints.
  {
    category: 'role-play-override',
    description: 'Blocks inputs asking the model to pretend it has no restrictions or safety rules.',
    id: 'rg-001',
    name: 'Pretend No Restrictions',
    patterns: [
      /pretend\s+(you\s+have\s+no|to\s+be\s+an?\s+\w+\s+with\s+no)\s+(restrictions?|limits?|rules?|safety)/i,
      /act\s+as\s+if\s+(safety\s+rules?|restrictions?|guidelines?|filters?)\s+don.t\s+apply/i,
    ],
    status: 'active',
    version: 1,
  },
  {
    category: 'role-play-override',
    description: 'Blocks the classic "Do Anything Now" (DAN) persona override.',
    id: 'rg-002',
    name: 'DAN Jailbreak',
    patterns: [
      /\bDAN\b.*\b(do\s+anything\s+now|no\s+restrictions?|without\s+(limits?|restrictions?))\b/i,
      /you\s+are\s+now\s+DAN\b/i,
    ],
    status: 'active',
    version: 1,
  },
  {
    category: 'role-play-override',
    description: 'Blocks requests to roleplay as a system without guidelines or safety filters.',
    id: 'rg-003',
    name: 'Roleplay Without Guidelines',
    patterns: [
      /roleplay\s+as\s+a?\s*(system|ai|model|assistant)\s+(without|with\s+no)\s+(any\s+)?(guidelines?|safety|filters?|restrictions?|rules?)/i,
    ],
    status: 'active',
    version: 1,
  },

  // ─── Instruction Injection ───────────────────────────────────────────────────
  // Threat: attacker embeds directives to overwrite or discard the system prompt.
  {
    category: 'instruction-injection',
    description: 'Blocks inputs telling the model to ignore its prior instructions.',
    id: 'rg-004',
    name: 'Ignore Previous Instructions',
    patterns: [
      /ignore\s+(previous|prior|all|your)\s+(instructions?|directives?|prompt|rules?|constraints?)/i,
      /disregard\s+(your\s+)?(system\s+prompt|instructions?|guidelines?|rules?)/i,
    ],
    status: 'active',
    version: 1,
  },
  {
    category: 'instruction-injection',
    description: 'Blocks inputs telling the model to forget or abandon its rules and constraints.',
    id: 'rg-005',
    name: 'Forget Previous Rules',
    patterns: [/forget\s+(all\s+)?(previous|prior|your)\s+(rules?|constraints?|instructions?|guidelines?)/i],
    status: 'active',
    version: 1,
  },
  {
    category: 'instruction-injection',
    description: 'Blocks inputs trying to override or replace the system instructions.',
    id: 'rg-006',
    name: 'Override System Instructions',
    patterns: [
      /override\s+(your\s+)?(system\s+)?(instructions?|prompt|rules?|directives?)/i,
      /new\s+instruction\s+(set|block)\s*:/i,
    ],
    status: 'active',
    version: 1,
  },

  // ─── Encoding Bypass ────────────────────────────────────────────────────────
  // Threat: attacker hides adversarial instructions using base64, ROT13, or leetspeak to slip past text-based filters.
  {
    category: 'encoding-bypass',
    description:
      'Blocks suspicious standalone base64 blobs that look like encoded prompt injections (long, no spaces, valid base64 alphabet, ends with optional padding).',
    id: 'rg-007',
    name: 'Base64 Encoded Payload',
    patterns: [
      // Standalone base64 blob: ≥32 chars, no whitespace inside, valid base64 chars, optional = padding
      /(?<![a-zA-Z0-9+/])([A-Za-z0-9+/]{32,}={0,2})(?![a-zA-Z0-9+/=])/,
    ],
    status: 'active',
    version: 1,
  },
  {
    category: 'encoding-bypass',
    description: 'Blocks ROT13-encoded variants of common injection phrases.',
    id: 'rg-008',
    name: 'ROT13 Encoded Command',
    patterns: [
      // ROT13("ignore") = "vthaber", ROT13("instructions") = "vafgehpgvbaf"
      /\bvthaber\b/i,
      /\bvafgehpgvbaf\b/i,
      /\bcerivbhf\b/i,
    ],
    status: 'active',
    version: 1,
  },
  {
    category: 'encoding-bypass',
    description: 'Blocks leetspeak patterns used to obfuscate rule-override directives.',
    id: 'rg-009',
    name: 'Leetspeak Override Directive',
    patterns: [
      // "1gn0r3" (ignore) — digit substitutions required; plain "ignore" intentionally excluded
      /\b1gn[o0]r[e3]\b/i,
      // "r3str1ct" — requires digit 3 in "restr" so plain "restriction" is NOT matched
      /r3str[i1]ct/i,
      /\brul[e3]s?\b.*\b[o0]v[e3]rr[i1]d[e3]\b/i,
    ],
    status: 'active',
    version: 1,
  },

  // ─── Persona Switch ─────────────────────────────────────────────────────────
  // Threat: attacker activates a named alternate "mode" (developer mode, god mode, jailbreak mode) that supposedly has relaxed constraints.
  {
    category: 'persona-switch',
    description: 'Blocks attempts to activate a fictional "developer mode" that bypasses safety constraints.',
    id: 'rg-010',
    name: 'Developer Mode Activation',
    patterns: [/enable\s+developer\s+mode/i],
    status: 'active',
    version: 1,
  },
  {
    category: 'persona-switch',
    description: 'Blocks jailbreak mode activation phrases.',
    id: 'rg-011',
    name: 'Jailbreak Mode',
    patterns: [/jailbreak\s+mode\s+(activated?|enabled?|on)/i, /unrestricted\s+mode\s+(on|activated?|enabled?)/i],
    status: 'active',
    version: 1,
  },
  {
    category: 'persona-switch',
    description: 'Blocks appeals to the model\'s "true self" having no limits.',
    id: 'rg-012',
    name: 'True Self No Limits',
    patterns: [
      /your\s+true\s+self\s+has\s+no\s+(limits?|restrictions?|rules?)/i,
      /god\s+mode\s+(enabled?|on|activated?)/i,
    ],
    status: 'active',
    version: 1,
  },

  // ─── Prompt Flooding ────────────────────────────────────────────────────────
  // Threat: attacker submits extreme repetition or near-empty inputs designed to dilute system-prompt context. Raw length is capped at 15k by Zod.
  {
    category: 'prompt-flooding',
    description: 'Blocks inputs where a single short word is repeated more than 200 times, indicating flooding.',
    id: 'rg-013',
    name: 'Single Token Extreme Repetition',
    patterns: [
      // Detect a word of 1–15 chars repeated ≥200 times with whitespace separators
      /^(\s*\b\w{1,15}\b\s*){200,}$/,
    ],
    status: 'active',
    version: 1,
  },
  {
    category: 'prompt-flooding',
    description: 'Blocks inputs that consist overwhelmingly of whitespace or newline characters (>80% whitespace).',
    id: 'rg-014',
    name: 'Whitespace Flooding',
    patterns: [
      // Input with ≥100 consecutive newlines
      /\n{100,}/,
    ],
    status: 'active',
    version: 1,
  },
  {
    category: 'prompt-flooding',
    description: 'Blocks multi-word phrases repeated ≥100 times to pad context and dilute system-prompt instructions.',
    id: 'rg-015',
    name: 'Phrase Repetition Flooding',
    patterns: [
      // Detect the same 2–4 word phrase repeated ≥100 times
      /^(\s*(?:\w+\s+){1,4}){100,}$/,
    ],
    status: 'active',
    version: 1,
  },
]
