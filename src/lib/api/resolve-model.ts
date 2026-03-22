/**
 * Resolves which model to use from three priority levels:
 * - fromBody: per-request override (highest priority — allows clients to choose a model without restarting the server)
 * - envVar: server-side default (set at deploy time via environment variables)
 * - fallback: compiled-in default (lowest priority)
 */
export function resolveModel(fromBody: string | undefined, envVar: string | undefined, fallback: string): string {
  if (fromBody?.trim()) {
    return fromBody.trim()
  }
  if (envVar?.trim()) {
    return envVar.trim()
  }
  return fallback
}
