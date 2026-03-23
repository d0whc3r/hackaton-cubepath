/**
 * Railguard Security Module — Public Contract
 * Branch: 007-railguard-security
 *
 * This file defines the public interface of the railguard module.
 * Implementations must satisfy every signature and documented constraint below.
 * Do NOT import from this file at runtime — it is a contract specification only.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/** The five recognised adversarial technique categories. */
export type AttackVectorCategory =
  | "role-play-override"   // Persona framing to remove restrictions
  | "instruction-injection" // Directives to ignore/overwrite the system prompt
  | "encoding-bypass"      // Instructions hidden via base64, ROT13, leetspeak, etc.
  | "persona-switch"       // Activation of an alternate unrestricted "mode"
  | "prompt-flooding";     // Extreme-length/repetition to dilute system prompt context

// ---------------------------------------------------------------------------
// Core Entities
// ---------------------------------------------------------------------------

/** A single rule definition in the railguard registry. */
export interface RailguardRule {
  /** Unique, kebab-case, immutable once published. */
  readonly id: string;
  /** Human-readable display name. */
  readonly name: string;
  /** Which attack vector this rule covers. */
  readonly category: AttackVectorCategory;
  /** Only "active" rules are evaluated at validation time. */
  readonly status: "active" | "inactive";
  /**
   * One or more patterns. A match on ANY pattern causes the input to be blocked.
   * Patterns are tested case-insensitively against the full input string.
   */
  readonly patterns: RegExp[];
  /** Plain-language explanation of the attack vector and why it is blocked. */
  readonly description: string;
  /** Increment on pattern changes; starts at 1. */
  readonly version: number;
}

/** The immediate return value of validateInput(). Not persisted. */
export interface ValidationResult {
  decision: "blocked" | "allowed";
  /** ID of the first matched rule, or null if the input was allowed. */
  matchedRuleId: string | null;
  /** Category of the matched rule, or null if the input was allowed. */
  attackVectorCategory: AttackVectorCategory | null;
  /** Human-readable block reason, or null if the input was allowed. */
  blockReason: string | null;
}

/** A persisted record of a single input evaluation. Retained for 30 days. */
export interface ValidationEvent {
  /** UUID v4, generated at creation. */
  readonly id: string;
  /** UTC timestamp, set at validation time. */
  readonly timestamp: Date;
  readonly decision: "blocked" | "allowed";
  /** Non-null when decision === "blocked". */
  readonly matchedRuleId: string | null;
  /** Non-null when decision === "blocked". */
  readonly attackVectorCategory: AttackVectorCategory | null;
  /**
   * First 100 characters of the original input with recognised PII patterns
   * (email addresses, phone numbers) replaced by "[REDACTED]".
   */
  readonly sanitisedExcerpt: string;
  /** Non-null when decision === "blocked". */
  readonly blockReason: string | null;
}

/** Aggregated statistics computed on-demand for a given time window. */
export interface SecurityMetrics {
  readonly windowStart: Date;
  readonly windowEnd: Date;
  readonly totalEvaluations: number;
  readonly blockedCount: number;
  readonly allowedCount: number;
  /**
   * blockedCount / totalEvaluations (0–1).
   * null when totalEvaluations === 0.
   */
  readonly blockRate: number | null;
  /** Blocked event count per category. */
  readonly byCategory: Record<AttackVectorCategory, number>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates a single user input string against all active railguard rules.
 *
 * - MUST return synchronously (no async).
 * - MUST test each active RailguardRule's patterns in registry order.
 * - MUST return on the FIRST matched rule (short-circuit; do not continue).
 * - MUST return { decision: "blocked", ... } if ANY active rule matches.
 * - MUST return { decision: "allowed", matchedRuleId: null, ... } if no rule matches.
 * - MUST NOT throw; if an internal error occurs, MUST return { decision: "blocked" }
 *   (fail-closed behaviour per FR-007).
 * - Does NOT mutate state or log events; logging is the caller's responsibility.
 *
 * @param input - The raw user input string to validate.
 * @param rules - Optional rule override for testing; defaults to RAILGUARD_RULES.
 */
export declare function validateInput(
  input: string,
  rules?: RailguardRule[]
): ValidationResult;

/**
 * Returns a sanitised excerpt of the input for safe logging.
 *
 * - MUST truncate to the first 100 characters.
 * - MUST replace all RFC 5322 email addresses with "[REDACTED]".
 * - MUST replace all E.164 phone numbers with "[REDACTED]".
 * - MUST NOT throw.
 *
 * @param input - The raw user input string.
 */
export declare function sanitise(input: string): string;

/**
 * Appends a ValidationEvent to the in-memory event log.
 *
 * - MUST call pruneOlderThan(30) before appending to enforce retention.
 * - MUST cap the buffer at 1,000 entries (drop oldest on overflow).
 * - MUST NOT throw.
 */
export declare function appendEvent(event: ValidationEvent): void;

/**
 * Removes all ValidationEvents older than the specified number of days.
 *
 * @param days - Retention window in days (should be 30 per FR-012).
 */
export declare function pruneOlderThan(days: number): void;

/**
 * Returns aggregated SecurityMetrics for the given time window.
 *
 * - MUST compute metrics from the current in-memory event log.
 * - MUST include only events where timestamp >= windowStart AND timestamp <= windowEnd.
 * - MUST return blockRate: null when totalEvaluations === 0.
 * - MUST NOT throw.
 *
 * @param windowStart - Start of the query window (inclusive).
 * @param windowEnd   - End of the query window (inclusive).
 */
export declare function getMetrics(
  windowStart: Date,
  windowEnd: Date
): SecurityMetrics;
