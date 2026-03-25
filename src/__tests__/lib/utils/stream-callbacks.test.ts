import type { AssistantMessage, RoutingStep } from '@/lib/schemas/route'
import { markTaskDone } from '@/lib/stores/chat-store'
import { addSaving } from '@/lib/utils/savings'
import {
  GENERATION_FAILED,
  GENERATION_STOPPED,
  buildStreamCallbacks,
  mergeRoutingStep,
} from '@/lib/utils/stream-callbacks'

vi.mock(import('@/lib/stores/chat-store'), () => ({
  markTaskDone: vi.fn(),
}))

vi.mock(import('@/lib/utils/savings'), () => ({
  addSaving: vi.fn(() => Promise.resolve()),
}))

function baseAssistant(overrides: Partial<AssistantMessage> = {}): AssistantMessage {
  return {
    blockReason: null,
    content: '',
    cost: null,
    error: null,
    routingSteps: [],
    specialist: null,
    status: 'streaming',
    ...overrides,
  }
}

describe('mergeRoutingStep', () => {
  it('appends a new routing step when step id is not present', () => {
    const existing: RoutingStep[] = [{ label: 'Analyze', status: 'done', step: 'analyzing_task' }]
    const incoming: RoutingStep = { label: 'Generate', status: 'active', step: 'generating_response' }

    const merged = mergeRoutingStep(existing, incoming)
    expect(merged).toEqual([...existing, incoming])
  })

  it('replaces existing routing step with same step id', () => {
    const existing: RoutingStep[] = [{ label: 'Generate', status: 'active', step: 'generating_response' }]
    const incoming: RoutingStep = { label: 'Generation complete', status: 'done', step: 'generating_response' }

    const merged = mergeRoutingStep(existing, incoming)
    expect(merged).toEqual([incoming])
  })
})

describe('buildStreamCallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates content, routing, specialist and status transitions through callbacks', () => {
    let current = baseAssistant()
    const update = vi.fn((_task, updater: (prev: AssistantMessage) => AssistantMessage) => {
      current = updater(current)
    })
    const callbacks = buildStreamCallbacks('explain', update)

    callbacks.onResponseChunk?.('hello ')
    callbacks.onResponseChunk?.('world')
    callbacks.onRoutingStep?.({ label: 'Generate', status: 'active', step: 'generating_response' })
    callbacks.onSpecialistSelected?.({
      displayName: 'Explainer',
      language: 'typescript',
      specialistId: 'explain',
    })
    callbacks.onError?.('stream failed')
    expect(current.routingSteps).toContainEqual(GENERATION_FAILED)
    callbacks.onDone?.()

    expect(current.content).toBe('hello world')
    expect(current.error).toBe('stream failed')
    expect(current.specialist?.specialistId).toBe('explain')
    expect(current.status).toBe('done')
    expect(markTaskDone).toHaveBeenCalledWith('explain')
  })

  it('replaces generating_response step with stopped state on interruption', () => {
    let current = baseAssistant({
      routingSteps: [{ label: 'Generate', status: 'active', step: 'generating_response' }],
    })
    const update = vi.fn((_task, updater: (prev: AssistantMessage) => AssistantMessage) => {
      current = updater(current)
    })
    const callbacks = buildStreamCallbacks('explain', update)

    callbacks.onInterrupted?.()

    expect(current.routingSteps).toEqual([GENERATION_STOPPED])
    expect(current.status).toBe('interrupted')
  })

  it('stores cost estimate and records savings', () => {
    let current = baseAssistant()
    const update = vi.fn((_task, updater: (prev: AssistantMessage) => AssistantMessage) => {
      current = updater(current)
    })
    const callbacks = buildStreamCallbacks('test', update)
    const cost = {
      inputTokens: 10,
      largeModelCostUsd: 0.01,
      outputTokens: 20,
      savingsPct: 35,
      specialistCostUsd: 0.0065,
    }

    callbacks.onCost?.(cost)

    expect(current.cost).toEqual(cost)
    expect(addSaving).toHaveBeenCalledWith(0.01, 10, 20)
  })
})
