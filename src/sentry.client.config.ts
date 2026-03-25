// oxlint-disable-next-line import/no-namespace
import * as Sentry from '@sentry/astro'

const dsn = import.meta.env.PUBLIC_SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    enableLogs: true,
    environment: import.meta.env.PUBLIC_APP_ENV ?? import.meta.env.MODE,
    integrations: [
      // Automatic performance tracing for page loads and navigations
      Sentry.browserTracingIntegration(),
      // Session replay on errors (full session sampling disabled by default)
      Sentry.replayIntegration({
        // Don't mask text/media by default — tighten in production if needed
        blockAllMedia: false,
        maskAllText: false,
      }),
    ],
    release: import.meta.env.PUBLIC_APP_VERSION,
    // Only record replays when an error occurs (0 = no sampling for normal sessions)
    replaysOnErrorSampleRate: 1,
    replaysSessionSampleRate: 0,
    // Include request headers, IP address, etc.
    sendDefaultPii: true,
    tracesSampleRate: Number(import.meta.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0'),
  })
}
