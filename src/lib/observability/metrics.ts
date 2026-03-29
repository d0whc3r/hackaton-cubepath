type StreamStatus = 'aborted' | 'done' | 'error'

interface MetricsSink {
  recordStreamChars(modelId: string, inputChars: number, outputChars: number): void
  recordStreamDuration(modelId: string, durationMs: number, status: StreamStatus): void
}

let sink: MetricsSink | null = null

export function setMetricsSink(nextSink: MetricsSink | null): void {
  sink = nextSink
}

export function recordStreamDuration(modelId: string, durationMs: number, status: StreamStatus): void {
  sink?.recordStreamDuration(modelId, durationMs, status)
}

export function recordStreamChars(modelId: string, inputChars: number, outputChars: number): void {
  sink?.recordStreamChars(modelId, inputChars, outputChars)
}
