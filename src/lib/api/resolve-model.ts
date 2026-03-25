/**
 * Resolves which model to use.
 *
 * Two-argument form  — resolveModel(fromBody, fallback):
 *   Used for models whose default lives in code constants.
 *   fromBody → fallback
 *
 * Three-argument form — resolveModel(fromBody, envVar, fallback):
 *   Used for values that vary by deployment environment (e.g. PUBLIC_OLLAMA_BASE_URL).
 *   fromBody → envVar → fallback
 */
export function resolveModel(fromBody: string | undefined, fallback: string): string
export function resolveModel(fromBody: string | undefined, envVar: string | undefined, fallback: string): string
export function resolveModel(
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
