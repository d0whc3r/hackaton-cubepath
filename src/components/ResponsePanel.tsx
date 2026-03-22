interface ResponsePanelProps {
  responseText: string
  specialistDisplayName: string | null
  error: string | null
  interrupted: boolean
}

export function ResponsePanel({ responseText, specialistDisplayName, error, interrupted }: ResponsePanelProps) {
  function handleCopy() {
    void navigator.clipboard.writeText(responseText)
  }

  return (
    <div>
      {specialistDisplayName && <div className="font-semibold">{specialistDisplayName}</div>}

      {interrupted && <div className="text-yellow-600">Interrupted — partial output below</div>}

      {error && <div className="text-red-600">{error}</div>}
      {!error && responseText && <pre className="whitespace-pre-wrap">{responseText}</pre>}
      {!error && !responseText && <div className="text-muted-foreground">Response will appear here</div>}

      {responseText && (
        <button type="button" onClick={handleCopy}>
          Copy
        </button>
      )}
    </div>
  )
}
