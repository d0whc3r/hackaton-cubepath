/**
 * Returns a sanitised excerpt of the input for safe logging.
 * - Truncates to the first 100 characters.
 * - Replaces all RFC 5322 email addresses with "[REDACTED]".
 * - Replaces all E.164 phone numbers with "[REDACTED]".
 * - Never throws.
 */
export function sanitise(input: string): string {
  try {
    const truncated = input.slice(0, 100)
    // RFC 5322 simplified email pattern
    const withoutEmails = truncated.replaceAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED]')
    // E.164 phone pattern: optional + then 7-15 digits (with optional separators)
    const withoutPhones = withoutEmails.replaceAll(/\+?[0-9][\d\s\-().]{6,19}[0-9]/g, '[REDACTED]')
    return withoutPhones
  } catch {
    return ''
  }
}
