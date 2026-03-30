/**
 * Candidate models for semantic guard checks.
 * Keep this list as plain Ollama model IDs only.
 * The first model is treated as the default.
 */
const GUARD_MODELS = ['qwen2.5:0.5b', 'llama3.2:1b', 'qwen2.5:1.5b', 'lfm2.5-thinking:1.2b'] as const

export const [DEFAULT_GUARD_MODEL] = GUARD_MODELS
