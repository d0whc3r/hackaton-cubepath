// Metrics stubs — no-ops until a real metrics backend is configured.

export function recordRouteRequest(_taskType: string): void {}

export function recordRouteBlocked(_taskType: string): void {}

export function recordStreamDuration(
  _modelId: string,
  _durationMs: number,
  _status: 'aborted' | 'done' | 'error',
): void {}

export function recordStreamChars(_modelId: string, _inputChars: number, _outputChars: number): void {}
