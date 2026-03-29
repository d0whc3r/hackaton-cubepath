/**
 * Resolves a string parameter from request input, then environment, then fallback.
 *
 * Two-argument form  — resolveValue(fromBody, fallback):
 *   Used for values whose default lives in code constants.
 *   fromBody → fallback
 *
 * Three-argument form — resolveValue(fromBody, envVar, fallback):
 *   Used for values that vary by deployment environment (e.g. PUBLIC_OLLAMA_BASE_URL).
 *   fromBody → envVar → fallback
 */
export function resolveValue(fromBody: string | undefined, fallback: string): string
export function resolveValue(fromBody: string | undefined, envVar: string | undefined, fallback: string): string
export function resolveValue(
  fromBody: string | undefined,
  envOrFallback: string | undefined,
  fallback?: string,
): string {
  if (fromBody?.trim()) {
    return fromBody.trim()
  }
  if (fallback !== undefined) {
    return envOrFallback?.trim() || fallback
  }
  return envOrFallback ?? ''
}
