/**
 * OpenTelemetry SDK for Grafana Cloud.
 * Sends logs → Loki, metrics → Mimir, traces → Tempo via OTLP protocol.
 *
 * Required env vars:
 *   GRAFANA_INSTANCE_ID   — numeric instance ID (shown in Grafana Cloud portal)
 *   GRAFANA_CLOUD_TOKEN   — Cloud Access Policy token with logs/metrics/traces:write
 *   GRAFANA_OTLP_ENDPOINT — e.g. https://otlp-gateway-prod-us-west-0.grafana.net/otlp
 */
import { logs as otelLogsApi } from '@opentelemetry/api-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'

const instanceId = import.meta.env.GRAFANA_INSTANCE_ID ?? ''
const cloudToken = import.meta.env.GRAFANA_CLOUD_TOKEN ?? ''
const otlpEndpoint = import.meta.env.GRAFANA_OTLP_ENDPOINT ?? 'https://otlp-gateway-prod-us-west-0.grafana.net/otlp'

export const isOTelEnabled = Boolean(instanceId && cloudToken)

if (isOTelEnabled) {
  const authHeader = `Basic ${btoa(`${instanceId}:${cloudToken}`)}`
  const headers = { Authorization: authHeader }

  const resource = resourceFromAttributes({
    'deployment.environment': import.meta.env.APP_ENV ?? import.meta.env.MODE ?? 'development',
    'service.name': 'cubepath',
    'service.version': '1.0.0',
  })

  const sdk = new NodeSDK({
    logRecordProcessors: [
      new BatchLogRecordProcessor(new OTLPLogExporter({ headers, url: `${otlpEndpoint}/v1/logs` })),
    ],
    metricReaders: [
      new PeriodicExportingMetricReader({
        exportIntervalMillis: 60_000,
        exporter: new OTLPMetricExporter({ headers, url: `${otlpEndpoint}/v1/metrics` }),
      }),
    ],
    resource,
    traceExporter: new OTLPTraceExporter({ headers, url: `${otlpEndpoint}/v1/traces` }),
  })

  sdk.start()

  process.on('SIGTERM', () => {
    sdk.shutdown().catch(console.error)
  })
}

const SEVERITY: Record<string, number> = {
  debug: 5,
  error: 17,
  fatal: 21,
  info: 9,
  trace: 1,
  warn: 13,
}

/**
 * Emit a log record directly to the OTel Logs SDK (→ Grafana Loki).
 * No-op when the SDK is not configured.
 */
export function otelLog(level: string, message: string, attrs?: Record<string, unknown>): void {
  otelLogsApi.getLogger('cubepath').emit({
    attributes: attrs as Record<string, string | number | boolean>,
    body: message,
    severityNumber: SEVERITY[level] ?? 0,
    severityText: level.toUpperCase(),
  })
}
