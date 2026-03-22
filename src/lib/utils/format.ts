export function formatUsd(usd: number): string {
  if (usd === 0) {
    return '$0.00'
  }
  if (usd < 0.000_001) {
    return `$${usd.toExponential(2)}`
  }
  return `$${usd.toFixed(7)}`
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
