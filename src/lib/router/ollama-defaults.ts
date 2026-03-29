/**
 * Ollama base URL default, resolved in priority order:
 *  1. PUBLIC_OLLAMA_BASE_URL env var (available both server and client via Astro)
 *  2. Hardcoded fallback for zero-config local dev
 *
 * When the user configures a URL in the web UI, that value is sent in the request
 * body and takes priority over this default in every API route. See resolveModel().
 */
export const OLLAMA_BASE_URL_DEFAULT: string = import.meta.env.PUBLIC_OLLAMA_BASE_URL ?? 'http://localhost:11434'
