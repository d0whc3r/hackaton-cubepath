import type { CostEstimate, RoutingStep, SpecialistInfo } from '@/lib/schemas/route'

export interface SSECallbacks {
  onRoutingStep: (step: RoutingStep) => void
  onSpecialistSelected: (payload: SpecialistInfo) => void
  onResponseChunk: (text: string) => void
  onCost: (cost: CostEstimate) => void
  onDone: () => void
  onInterrupted: () => void
  onError: (message: string) => void
}

export async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: SSECallbacks,
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''
  let eventType = ''
  let dataLine = ''

  const processLine = (line: string) => {
    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLine = line.slice(5).trim()
    } else if (line === '') {
      if (eventType && dataLine) {
        try {
          dispatchSSEEvent(eventType, JSON.parse(dataLine) as Record<string, unknown>, callbacks)
        } catch {
          /* Ignore malformed */
        }
      }
      eventType = ''
      dataLine = ''
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      processLine(line)
    }
  }
  if (buffer) {
    processLine(buffer)
  }
}

function dispatchSSEEvent(event: string, data: Record<string, unknown>, callbacks: SSECallbacks): void {
  switch (event) {
    case 'routing_step': {
      callbacks.onRoutingStep(data as unknown as RoutingStep)
      break
    }
    case 'specialist_selected': {
      callbacks.onSpecialistSelected(data as unknown as SpecialistInfo)
      break
    }
    case 'response_chunk': {
      callbacks.onResponseChunk(data.text as string)
      break
    }
    case 'cost': {
      callbacks.onCost(data as unknown as CostEstimate)
      break
    }
    case 'done': {
      callbacks.onDone()
      break
    }
    case 'interrupted': {
      callbacks.onInterrupted()
      break
    }
    case 'error': {
      callbacks.onError(data.message as string)
      break
    }
  }
}
