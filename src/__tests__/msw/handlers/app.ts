import { HttpResponse, http } from 'msw'

// Happy-path handlers for the app's own API routes
export const appHandlers = [
  http.get('/api/ollama/models', () => HttpResponse.json({ models: ['llama3.2'] })),

  http.get('/api/ollama/model', () =>
    HttpResponse.json({
      details: { capabilities: ['completion'], contextLength: 4096, family: 'llama', parameterSize: '3.2B' },
      model: 'llama3.2',
    }),
  ),

  http.post('/api/ollama/pull', () => {
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder()
        controller.enqueue(enc.encode('data: {"status":"pulling"}\n\n'))
        controller.enqueue(enc.encode('data: {"status":"success"}\n\n'))
        controller.close()
      },
    })
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }),

  http.post('/api/route', () => {
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder()
        controller.enqueue(enc.encode('data: {"text":"hello"}\n\n'))
        controller.enqueue(enc.encode('data: {"done":true}\n\n'))
        controller.close()
      },
    })
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }),

  http.post('/api/translate', () => {
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder()
        controller.enqueue(enc.encode('data: {"text":"hola"}\n\n'))
        controller.close()
      },
    })
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }),
]

// Error-case handlers; use with server.use(...) inside a test
export const appErrorHandlers = {
  modelNetworkError: http.get('/api/ollama/model', () => HttpResponse.error()),
  models404: http.get('/api/ollama/models', () => HttpResponse.json({ error: 'not found' }, { status: 404 })),
  models500: http.get('/api/ollama/models', () => HttpResponse.json({ error: 'server error' }, { status: 500 })),
  route500: http.post('/api/route', () => HttpResponse.json({ error: 'server error' }, { status: 500 })),
}
