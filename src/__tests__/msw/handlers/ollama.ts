import { HttpResponse, http } from 'msw'

// Happy-path handlers for Ollama API
export const ollamaHandlers = [
  http.get('http://localhost:11434/api/tags', () =>
    HttpResponse.json({ models: [{ modified_at: '2024-01-01', name: 'llama3.2:latest', size: 1000 }] }),
  ),

  http.post('http://localhost:11434/api/show', () =>
    HttpResponse.json({
      capabilities: ['completion'],
      details: { family: 'llama', parameter_size: '3.2B', quantization_level: 'Q4_0' },
      model_info: { 'llama.context_length': 4096 },
    }),
  ),

  http.post('http://localhost:11434/api/pull', () => {
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder()
        controller.enqueue(enc.encode('{"status":"pulling"}\n'))
        controller.enqueue(enc.encode('{"status":"success"}\n'))
        controller.close()
      },
    })
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'application/x-ndjson' },
    })
  }),
]
