interface ResponsePanelProps {
  readonly responseText: string
  readonly specialistDisplayName: string | null
  readonly error: string | null
  readonly interrupted: boolean
}

export function ResponsePanel({ responseText, specialistDisplayName, error, interrupted }: ResponsePanelProps) {
  function handleCopy() {
    void navigator.clipboard.writeText(responseText)
  }

  return (
    <div>
      {specialistDisplayName && <div className="font-semibold">{specialistDisplayName}</div>}

      {interrupted && <div className="text-yellow-600">Interrupted — partial output below</div>}

      {error ? (
        <div className="text-red-600">{error}</div>
      ) : responseText ? (
        <pre className="whitespace-pre-wrap">{responseText}</pre>
      ) : (
        <div className="text-muted-foreground">Response will appear here</div>
      )}

      {responseText && (
        <button type="button" onClick={handleCopy}>
          Copy
        </button>
      )}
    </div>
  )
}
