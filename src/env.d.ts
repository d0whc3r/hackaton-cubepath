/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  // The public URL of the site
  readonly PUBLIC_SITE_URL?: string
  // Ollama base URL — used as the default endpoint shown in the settings UI and in server API routes.
  // When the user configures a different URL in the web UI, that value takes priority in every request.
  readonly PUBLIC_OLLAMA_BASE_URL?: string
  readonly PUBLIC_LOG_LEVEL?: string
  readonly PUBLIC_SENTRY_DSN?: string
  readonly PUBLIC_SENTRY_LOG_LEVEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
