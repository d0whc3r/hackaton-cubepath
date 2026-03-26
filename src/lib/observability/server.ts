import type { LogLayerTransport } from '@loglayer/transport'
import { SentryTransport } from '@loglayer/transport-sentry'
// oxlint-disable-next-line import/no-namespace
import * as Sentry from '@sentry/cloudflare'
import { ConsoleTransport, LogLayer } from 'loglayer'
import { serializeError } from 'serialize-error'
import type { LogContext, LogLevel } from '@/lib/observability/types'
import { redactionPlugin } from '@/lib/observability/redact'

function toLogLevel(level: string | undefined, fallback: LogLevel = 'info'): LogLevel {
  if (level === 'debug' || level === 'error' || level === 'info' || level === 'warn') {
    return level
  }
  return fallback
}

function createServerTransports() {
  const transports: LogLayerTransport[] = [
    new ConsoleTransport({
      id: 'console',
      level: toLogLevel(import.meta.env.LOG_LEVEL, 'info'),
      logger: console,
    }),
  ]

  // Sentry is initialized in sentry.server.config.ts by @sentry/astro.
  // Here we only attach the log transport if the DSN is configured.
  const sentryDsn = import.meta.env.SENTRY_DSN
  if (sentryDsn) {
    transports.push(
      new SentryTransport({
        id: 'sentry',
        level: toLogLevel(import.meta.env.SENTRY_LOG_LEVEL, 'warn'),
        logger: Sentry.logger,
      }),
    )
  }

  return transports
}

const serverLog = new LogLayer({
  contextFieldName: 'context',
  errorSerializer: serializeError,
  metadataFieldName: 'metadata',
  plugins: [
    redactionPlugin({
      censor: '[REDACTED]',
      paths: ['authorization', 'headers.authorization', 'headers.cookie', 'body.password', 'body.token'],
    }),
  ],
  transport: createServerTransports(),
})

export function logServer(level: LogLevel, message: string, context?: LogContext): void {
  if (context) {
    serverLog.withMetadata(context)[level](message)
  } else {
    serverLog[level](message)
  }
}

export function logServerError(message: string, error: unknown, context?: LogContext): void {
  if (context) {
    serverLog.withError(error).withMetadata(context).error(message)
  } else {
    serverLog.withError(error).error(message)
  }
}
