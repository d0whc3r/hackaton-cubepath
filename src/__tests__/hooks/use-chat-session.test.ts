import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import type { ModelConfig } from '@/lib/config/model-config'
import type { ConversationEntry, TaskType } from '@/lib/schemas/route'
import { useChatSession } from '@/hooks/use-chat-session'
import { getModelForTask, loadModelConfig } from '@/lib/config/model-config'
import { BlockedError, buildRouteMutationOptions } from '@/lib/services/route.service'
import { resetStore } from '@/lib/stores/chat-store'
import { notify } from '@/lib/ui/notifications'
import { clearHistoryAsync, loadHistoryAsync } from '@/lib/utils/history'

const { mockedModelConfig } = vi.hoisted(() => ({
  mockedModelConfig: {
    analystModel: 'analyst-model',
    commitModel: 'commit-model',
    deadCodeModel: 'dead-code-model',
    docstringModel: 'docstring-model',
    errorExplainModel: 'error-explain-model',
    explainModel: 'explain-model',
    modelRuntime: 'small',
    namingHelperModel: 'naming-helper-model',
    ollamaBaseUrl: 'http://localhost:11434',
    performanceHintModel: 'performance-hint-model',
    refactorModel: 'refactor-model',
    testModel: 'test-model',
    translateModel: 'translate-model',
    typeHintsModel: 'type-hints-model',
  } satisfies ModelConfig,
}))

vi.mock(import('@/lib/utils/history'), () => ({
  clearHistoryAsync: vi.fn(() => Promise.resolve()),
  getHistoryHintCount: vi.fn(() => 0),
  loadHistoryAsync: vi.fn(() => Promise.resolve([])),
  saveHistoryAsync: vi.fn(() => Promise.resolve()),
}))

vi.mock(import('@/lib/utils/savings'), () => ({
  addSaving: vi.fn(),
}))

vi.mock(import('@/lib/services/route.service'), () => ({
  BlockedError: class extends Error {
    // oxlint-disable-next-line typescript/parameter-properties
    constructor(public readonly blockReason: string) {
      super('Input blocked by security policy.')
      this.name = 'BlockedError'
    }
  },
  buildRouteMutationOptions: vi.fn(() => ({
    mutationFn: vi.fn().mockResolvedValue(null),
    mutationKey: ['route'],
  })),
}))

vi.mock(import('@/lib/ui/notifications'), () => ({
  copyNotificationDetails: vi.fn(),
  notify: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock(import('@/lib/config/model-config'), () => ({
  DEFAULTS: mockedModelConfig,
  getAnalystModel: vi.fn(() => 'analyst-model'),
  getModelForTask: vi.fn(() => 'test-model'),
  loadModelConfig: vi.fn(() => mockedModelConfig),
}))

function renderUseChatSession(fixedTaskType?: TaskType) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return renderHook(() => useChatSession(fixedTaskType), { wrapper })
}

describe('useChatSession', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
    vi.mocked(clearHistoryAsync).mockResolvedValue()
    vi.mocked(loadHistoryAsync).mockResolvedValue([])
    vi.mocked(getModelForTask).mockReturnValue('test-model')
    vi.mocked(loadModelConfig).mockReturnValue({
      analystModel: 'analyst-model',
      commitModel: 'commit-model',
      deadCodeModel: 'dead-code-model',
      docstringModel: 'docstring-model',
      errorExplainModel: 'error-explain-model',
      explainModel: 'explain-model',
      modelRuntime: 'local',
      namingHelperModel: 'naming-helper-model',
      ollamaBaseUrl: 'http://localhost:11434',
      performanceHintModel: 'performance-hint-model',
      refactorModel: 'refactor-model',
      testModel: 'test-model',
      translateModel: 'translate-model',
      typeHintsModel: 'type-hints-model',
    })
    vi.mocked(buildRouteMutationOptions).mockReturnValue({
      mutationFn: vi.fn().mockResolvedValue(null),
      mutationKey: ['route'],
    })
  })

  it('initialises entries from loadHistoryAsync', async () => {
    const mockEntry: ConversationEntry = {
      assistantMessage: {
        blockReason: null,
        content: 'hi',
        cost: null,
        error: null,
        errorCode: null,
        routingSteps: [],
        specialist: null,
        status: 'done',
      },
      id: '1',
      userMessage: { content: 'hello', taskType: 'explain', timestamp: new Date() },
    }
    vi.mocked(loadHistoryAsync).mockResolvedValueOnce([mockEntry])

    const { result } = renderUseChatSession('explain')
    await waitFor(() => expect(result.current.entries).toHaveLength(1))
    expect(result.current.entries[0].id).toBe('1')
  })

  it('initialises activeTask from fixedTaskType', () => {
    const { result } = renderUseChatSession('commit')
    expect(result.current.activeTask).toBe('commit')
  })

  it('defaults activeTask to explain when no fixedTaskType', () => {
    const { result } = renderUseChatSession()
    expect(result.current.activeTask).toBe('explain')
  })

  it('handleSubmit appends entry with streaming status', async () => {
    const { result } = renderUseChatSession()
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    act(() => {
      result.current.handleSubmit('const x = 1', 'explain')
    })

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].assistantMessage.status).toBe('streaming')
    expect(result.current.entries[0].userMessage.content).toBe('const x = 1')
  })

  it('handleCancel sets last entry status to interrupted', async () => {
    vi.mocked(buildRouteMutationOptions).mockReturnValueOnce({
      mutationFn: vi.fn(() => new Promise<void>(() => {})),
      mutationKey: ['route'],
    })
    const { result } = renderUseChatSession()
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    act(() => {
      result.current.handleSubmit('some code', 'explain')
    })

    act(() => {
      result.current.handleCancel()
    })

    expect(result.current.entries[0].assistantMessage.status).toBe('interrupted')
  })

  it('handleClearHistory empties entries', async () => {
    vi.mocked(loadHistoryAsync).mockResolvedValueOnce([
      {
        assistantMessage: {
          blockReason: null,
          content: '',
          cost: null,
          error: null,
          errorCode: null,
          routingSteps: [],
          specialist: null,
          status: 'done',
        },
        id: '1',
        userMessage: { content: 'test', taskType: 'explain', timestamp: new Date() },
      },
    ])
    const { result } = renderUseChatSession('explain')
    await waitFor(() => expect(result.current.entries).toHaveLength(1))

    act(() => {
      result.current.handleClearHistory()
    })

    expect(result.current.entries).toHaveLength(0)
    expect(clearHistoryAsync).toHaveBeenCalledWith('explain')
  })

  it('fixedTaskType overrides submitted task in entry and mutation payload', async () => {
    const mutationFn = vi.fn(() => new Promise<void>(() => {}))
    vi.mocked(buildRouteMutationOptions).mockReturnValueOnce({
      mutationFn,
      mutationKey: ['route'],
    })
    const { result } = renderUseChatSession('refactor')
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    act(() => {
      result.current.handleSubmit('code', 'test')
    })

    expect(result.current.entries[0].userMessage.taskType).toBe('refactor')
    await waitFor(() =>
      expect(mutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          input: 'code',
          taskType: 'refactor',
        }),
        expect.anything(),
      ),
    )
  })

  it('fixedTaskType locks activeTask despite setActiveTask calls', () => {
    const { result } = renderUseChatSession('refactor')

    act(() => {
      result.current.setActiveTask('explain' as TaskType)
    })

    expect(result.current.activeTask).toBe('refactor')
  })

  it('sets blocked status and block reason when mutation rejects with BlockedError', async () => {
    const mutationFn = vi.fn().mockRejectedValueOnce(new BlockedError('Task and input do not match'))
    vi.mocked(buildRouteMutationOptions).mockReturnValueOnce({
      mutationFn,
      mutationKey: ['route'],
    })
    const { result } = renderUseChatSession()
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    act(() => {
      result.current.handleSubmit('write me a poem', 'explain')
    })

    await waitFor(() => expect(result.current.entries[0].assistantMessage.status).toBe('blocked'))
    expect(result.current.entries[0].assistantMessage.blockReason).toBe('Task and input do not match')
    expect(notify.warning).toHaveBeenCalledWith(
      'Request blocked by policy',
      expect.objectContaining({ description: 'Task and input do not match' }),
    )
  })

  it('sets error status and message when mutation rejects with generic error', async () => {
    const mutationFn = vi.fn().mockRejectedValueOnce(new Error('Network unavailable'))
    vi.mocked(buildRouteMutationOptions).mockReturnValueOnce({
      mutationFn,
      mutationKey: ['route'],
    })
    const { result } = renderUseChatSession()
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    act(() => {
      result.current.handleSubmit('code', 'explain')
    })

    await waitFor(() => expect(result.current.entries[0].assistantMessage.status).toBe('error'))
    expect(result.current.entries[0].assistantMessage.error).toBe('Network unavailable')
    expect(notify.error).toHaveBeenCalledWith(
      'Request failed',
      expect.objectContaining({ description: 'Network unavailable' }),
    )
  })
})
