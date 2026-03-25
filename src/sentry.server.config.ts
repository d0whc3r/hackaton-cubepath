import * as Sentry from '@sentry/astro'

const dsn = import.meta.env.SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    enableLogs: true,
    environment: import.meta.env.APP_ENV ?? import.meta.env.MODE,
    release: import.meta.env.APP_VERSION,
    // Include request headers, IP address, etc.
    sendDefaultPii: true,
    tracesSampleRate: Number(import.meta.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
  })
}
