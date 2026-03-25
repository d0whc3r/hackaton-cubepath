/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  // Ollama base URL — used as the default endpoint shown in the settings UI and in server API routes.
  // When the user configures a different URL in the web UI, that value takes priority in every request.
  readonly PUBLIC_OLLAMA_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
