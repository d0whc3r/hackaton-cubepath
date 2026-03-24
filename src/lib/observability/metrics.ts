/**
 * Application-level OpenTelemetry metrics → Grafana Cloud Mimir (Prometheus).
 *
 * Instruments are created at module load time. When the OTel SDK is not
 * configured the `metrics.getMeter()` returns a no-op provider, so all
 * calls here are safe and silent with no env vars set.
 */
import { metrics } from '@opentelemetry/api'

const meter = metrics.getMeter('cubepath', '1.0.0')

// ── Routing ─────────────────────────────────────────────────────────────────

const routeRequestsCounter = meter.createCounter('cubepath.route.requests', {
  description: 'Total routing requests by task type',
})

const routeBlockedCounter = meter.createCounter('cubepath.route.blocked', {
  description: 'Requests blocked by railguard security policy',
})

// ── Streaming ────────────────────────────────────────────────────────────────

const streamDurationHistogram = meter.createHistogram('cubepath.stream.duration', {
  description: 'Streaming response duration in milliseconds',
  unit: 'ms',
})

const streamInputCharsHistogram = meter.createHistogram('cubepath.stream.input.chars', {
  description: 'Input character count for streaming requests',
})

const streamOutputCharsHistogram = meter.createHistogram('cubepath.stream.output.chars', {
  description: 'Output character count for streaming responses',
})

// ── Public API ───────────────────────────────────────────────────────────────

export function recordRouteRequest(taskType: string): void {
  routeRequestsCounter.add(1, { 'task.type': taskType })
}

export function recordRouteBlocked(taskType: string): void {
  routeBlockedCounter.add(1, { 'task.type': taskType })
}

export function recordStreamDuration(modelId: string, durationMs: number, status: 'aborted' | 'done' | 'error'): void {
  streamDurationHistogram.record(durationMs, { 'model.id': modelId, status })
}

export function recordStreamChars(modelId: string, inputChars: number, outputChars: number): void {
  streamInputCharsHistogram.record(inputChars, { 'model.id': modelId })
  streamOutputCharsHistogram.record(outputChars, { 'model.id': modelId })
}
