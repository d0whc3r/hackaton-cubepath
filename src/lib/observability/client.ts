import { redactionPlugin } from '@loglayer/plugin-redaction'
import { HttpTransport } from '@loglayer/transport-http'
import { SentryTransport } from '@loglayer/transport-sentry'
import * as Sentry from '@sentry/browser'
import { ConsoleTransport, LogLayer } from 'loglayer'
import { serializeError } from 'serialize-error'
import type { LogContext, LogLevel } from '@/lib/observability/types'

const isBrowser = globalThis.window !== undefined
const isTestEnv = import.meta.env.MODE === 'test' || import.meta.env.VITEST === 'true'

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

  const sentryDsn = import.meta.env.PUBLIC_SENTRY_DSN
  if (isBrowser && sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      enableLogs: true,
      environment: import.meta.env.PUBLIC_APP_ENV ?? import.meta.env.MODE,
      tracesSampleRate: Number(import.meta.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0'),
    })

    transports.push(
      new SentryTransport({
        id: 'sentry',
        level: toLogLevel(import.meta.env.PUBLIC_SENTRY_LOG_LEVEL, 'warn'),
        logger: Sentry.logger,
      }),
    )
  }

  const forwardUrl = import.meta.env.PUBLIC_LOG_HTTP_ENDPOINT ?? '/api/telemetry/log'
  if (isBrowser && !isTestEnv && forwardUrl) {
    transports.push(
      new HttpTransport({
        headers: { 'Content-Type': 'application/json' },
        id: 'http-forward',
        level: toLogLevel(import.meta.env.PUBLIC_LOG_FORWARD_LEVEL, 'warn'),
        payloadTemplate: ({ data, logLevel, message }) =>
          JSON.stringify({
            context: data,
            level: logLevel,
            message,
            source: 'client',
            timestamp: new Date().toISOString(),
          }),
        url: forwardUrl,
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
      paths: ['authorization', 'password', 'token', '*.authorization', '*.password', '*.token'],
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
