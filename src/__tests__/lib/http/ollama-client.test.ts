import { WretchError } from 'wretch'

import { ollamaWretch } from '@/lib/http/ollama-client'

import { ollamaErrorHandlers } from '../../msw/handlers/ollama'
import { server } from '../../msw/server'

const BASE = 'http://localhost:11434'

describe('ollamaWretch', () => {
  afterEach(() => server.resetHandlers())

  it('returns parsed JSON for a successful GET', async () => {
    const data = await ollamaWretch.url(`${BASE}/api/tags`).get().json<{ models: unknown[] }>()
    expect(data.models).toHaveLength(1)
  })

  it('returns parsed JSON for a successful POST', async () => {
    const data = await ollamaWretch
      .url(`${BASE}/api/show`)
      .post({ model: 'llama3.2' })
      .json<{ capabilities: string[] }>()
    expect(data.capabilities).toContain('completion')
  })

  it('throws WretchError on 4xx', async () => {
    server.use(ollamaErrorHandlers.show404)
    await expect(ollamaWretch.url(`${BASE}/api/show`).post({ model: 'missing' }).json()).rejects.toBeInstanceOf(
      WretchError,
    )
  })

  it('throws WretchError on 5xx', async () => {
    server.use(ollamaErrorHandlers.tags500)
    await expect(ollamaWretch.url(`${BASE}/api/tags`).get().json()).rejects.toBeInstanceOf(WretchError)
  })

  it('returns raw Response for streaming calls via .res()', async () => {
    const res = await ollamaWretch.url(`${BASE}/api/pull`).post({ name: 'llama3.2', stream: true }).res()
    expect(res.ok).toBeTruthy()
    expect(res.body).not.toBeNull()
  })
})
