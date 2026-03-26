import { SentryTransport } from '@loglayer/transport-sentry'
// oxlint-disable-next-line import/no-namespace
import * as Sentry from '@sentry/browser'
import { ConsoleTransport, LogLayer } from 'loglayer'
import { serializeError } from 'serialize-error'
import type { LogContext, LogLevel } from '@/lib/observability/types'
import { redactionPlugin } from '@/lib/observability/redact'

const isBrowser = globalThis.window !== undefined

function toLogLevel(level: string | undefined, fallback: LogLevel = 'info'): LogLevel {
  if (level === 'debug' || level === 'error' || level === 'info' || level === 'warn') {
    return level
  }
  return fallback
}

function createClientTransports() {
  const transports = [
    new ConsoleTransport({
      id: 'console',
      level: toLogLevel(import.meta.env.PUBLIC_LOG_LEVEL, 'info'),
      logger: console,
    }),
  ]

  // Sentry is initialized in sentry.client.config.ts by @sentry/astro.
  // Here we only attach the log transport if the DSN is configured.
  const sentryDsn = import.meta.env.PUBLIC_SENTRY_DSN
  if (isBrowser && sentryDsn) {
    transports.push(
      new SentryTransport({
        id: 'sentry',
        level: toLogLevel(import.meta.env.PUBLIC_SENTRY_LOG_LEVEL, 'warn'),
        logger: Sentry.logger,
      }),
    )
  }

  return transports
}

const clientLog = new LogLayer({
  contextFieldName: 'context',
  enabled: isBrowser,
  errorSerializer: serializeError,
  metadataFieldName: 'metadata',
  plugins: [
    redactionPlugin({
      censor: '[REDACTED]',
      paths: ['authorization', 'password', 'token'],
    }),
  ],
  transport: createClientTransports(),
})

export function logClient(level: LogLevel, message: string, context?: LogContext): void {
  if (context) {
    clientLog.withMetadata(context)[level](message)
    return
  }
  clientLog[level](message)
}

export function logClientError(message: string, error: unknown, context?: LogContext): void {
  if (context) {
    clientLog.withError(error).withMetadata(context).error(message)
    return
  }
  clientLog.withError(error).error(message)
}
