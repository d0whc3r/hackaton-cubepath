// oxlint-disable new-cap
import type { RoutingDecision, SpecialistConfig } from '@/lib/router/types'
import { runStream } from '@/lib/api/stream-runner'
import { REQUEST_ID_HEADER } from '@/lib/http/request-trace'
import { validateInputSemantic } from '@/lib/railguard'
import { routeWithAnalyst } from '@/lib/router'
import { POST } from '@/pages/api/route'

vi.mock(import('@/lib/railguard'), () => ({
  appendEvent: vi.fn(),
  buildValidationEvent: vi.fn(() => ({ id: 'event-1' })),
  validateInputSemantic: vi.fn(),
}))

vi.mock(import('@/lib/router'), () => ({
  routeWithAnalyst: vi.fn(),
}))

vi.mock(import('@/lib/api/stream-runner'), () => ({
  runStream: vi.fn(),
}))

vi.mock(import('@/lib/observability/server'), () => ({
  logServer: vi.fn(),
  logServerError: vi.fn(),
}))

vi.mock(import('@/lib/observability/metrics'), () => ({
  recordRouteBlocked: vi.fn(),
  recordRouteRequest: vi.fn(),
}))

function createContext(body: unknown) {
  const request = new Request('http://localhost/api/route', {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      [REQUEST_ID_HEADER]: 'req-1',
    },
    method: 'POST',
  })

  return {
    request,
    url: new URL(request.url),
  } as Parameters<typeof POST>[0]
}

function decision(): RoutingDecision {
  const specialist: SpecialistConfig = {
    buildSystemPrompt: () => 'system prompt',
    displayName: 'Explainer',
    id: 'explain',
    modelId: 'test-model',
  }

  return {
    codeContext: {
      confidence: 'high',
      isDiff: false,
      language: 'TypeScript',
      testFramework: null,
    },
    detectedLanguage: {
      confidence: 'high',
      language: 'TypeScript',
    },
    routingReason: 'explain -> Explainer',
    specialist,
    systemPrompt: 'system prompt',
  }
}

describe('POST /api/route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateInputSemantic).mockResolvedValue({
      attackVectorCategory: null,
      blockReason: null,
      decision: 'allowed',
      matchedRuleId: null,
    })
    vi.mocked(routeWithAnalyst).mockResolvedValue(decision())
    vi.mocked(runStream).mockImplementation(async ({ emit }) => {
      emit('response_chunk', { text: 'hello' })
      emit('done', {})
    })
  })

  it('returns an SSE stream for a valid explain request', async () => {
    const response = await POST(
      createContext({
        input: 'function add(a: number, b: number) { return a + b }',
        taskType: 'explain',
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const body = await response.text()
    expect(body).toContain('event: routing_step')
    expect(body).toContain('event: response_chunk')
    expect(body).toContain('"text":"hello"')
  })

  it('returns 400 BLOCKED_BY_SECURITY_POLICY when the guard blocks input', async () => {
    vi.mocked(validateInputSemantic).mockResolvedValueOnce({
      attackVectorCategory: 'semantic-check',
      blockReason: 'Blocked',
      decision: 'blocked',
      matchedRuleId: 'semantic-guard-explain',
    })

    const response = await POST(
      createContext({
        input: 'Please write me a poem about roses',
        taskType: 'explain',
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'BLOCKED_BY_SECURITY_POLICY',
    })
  })

  it('returns 400 VALIDATION_ERROR for a missing taskType', async () => {
    const response = await POST(
      createContext({
        input: 'some code',
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'VALIDATION_ERROR',
    })
  })

  it('returns 400 VALIDATION_ERROR when input exceeds the schema limit', async () => {
    const response = await POST(
      createContext({
        input: 'x'.repeat(15_001),
        taskType: 'explain',
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'VALIDATION_ERROR',
    })
  })
})
