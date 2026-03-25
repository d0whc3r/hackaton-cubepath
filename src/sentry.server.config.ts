// oxlint-disable-next-line import/no-namespace
import * as Sentry from '@sentry/astro'
import { EventEmitter } from 'node:events'
// Sentry's OpenTelemetry instrumentation and pino's thread-stream can attach
// More than 10 listeners to ChildProcess/Worker objects. Raise the limit early
// To prevent MaxListenersExceededWarning in the standalone server runtime.
EventEmitter.defaultMaxListeners = 30

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
