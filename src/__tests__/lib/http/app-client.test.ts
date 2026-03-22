import { WretchError } from 'wretch'

import { appWretch } from '@/lib/http/app-client'

import { appErrorHandlers } from '../../msw/handlers/app'
import { server } from '../../msw/server'

describe('appWretch', () => {
  afterEach(() => server.resetHandlers())

  it('returns parsed JSON for a successful GET', async () => {
    const data = await appWretch.url('/api/ollama/models').get().json<{ models: string[] }>()
    expect(data.models).toEqual(['llama3.2'])
  })

  it('encodes query params correctly via .query()', async () => {
    const data = await appWretch
      .url('/api/ollama/models')
      .query({ baseUrl: 'http://localhost:11434' })
      .get()
      .json<{ models: string[] }>()
    expect(data.models).toEqual(['llama3.2'])
  })

  it('sends correct Content-Type for POST with object body', async () => {
    const res = await appWretch
      .url('/api/ollama/pull')
      .post({ baseUrl: 'http://localhost:11434', model: 'llama3.2' })
      .res()
    expect(res.ok).toBeTruthy()
  })

  it('throws after exhausting retries on 5xx', async () => {
    server.use(appErrorHandlers.models500)
    // Wretch-middlewares throws "Number of attempts exceeded." after all retries
    await expect(appWretch.url('/api/ollama/models').get().json()).rejects.toThrow()
  })

  it('throws WretchError on 4xx', async () => {
    server.use(appErrorHandlers.models404)
    await expect(appWretch.url('/api/ollama/models').get().json()).rejects.toBeInstanceOf(WretchError)
  })

  it('returns raw Response for streaming calls via .res()', async () => {
    const res = await appWretch.url('/api/route').post({ messages: [] }).res()
    expect(res.ok).toBeTruthy()
    expect(res.body).not.toBeNull()
  })
})
