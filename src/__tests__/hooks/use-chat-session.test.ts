// Provide a minimal QueryClient wrapper
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'

import type { ConversationEntry, TaskType } from '@/lib/schemas/route'

import { useChatSession } from '@/hooks/use-chat-session'
import { clearHistory, loadHistory, saveHistory } from '@/lib/utils/history'

// --- Mocks ---
vi.mock(import('@/lib/utils/history'), () => ({
  clearHistory: vi.fn(),
  loadHistory: vi.fn(() => []),
  saveHistory: vi.fn(),
}))

vi.mock(import('@/lib/utils/savings'), () => ({
  addSaving: vi.fn(),
}))

vi.mock(import('@/lib/services/route.service'), () => ({
  buildRouteMutationOptions: vi.fn(() => ({
    mutationFn: vi.fn(),
    mutationKey: ['route'],
  })),
}))

vi.mock(import('@/components/model/ModelConfigDialog'), () => ({
  getAnalystModel: vi.fn(() => 'analyst-model'),
  getModelForTask: vi.fn(() => 'test-model'),
  loadModelConfig: vi.fn(() => ({
    analystModel: 'analyst-model',
    commitModel: 'commit-model',
    explainModel: 'explain-model',
    ollamaBaseUrl: 'http://localhost:11434',
    refactorModel: 'refactor-model',
    testModel: 'test-model',
    translateModel: 'translate-model',
  })),
}))

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useChatSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadHistory).mockReturnValue([])
  })

  it('initialises entries from loadHistory', () => {
    const mockEntry: ConversationEntry = {
      assistantMessage: { content: 'hi', cost: null, error: null, routingSteps: [], specialist: null, status: 'done' },
      id: '1',
      userMessage: { content: 'hello', taskType: 'explain', timestamp: new Date() },
    }
    vi.mocked(loadHistory).mockReturnValueOnce([mockEntry])

    const { result } = renderHook(() => useChatSession('explain'), { wrapper: makeWrapper() })
    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].id).toBe('1')
  })

  it('initialises activeTask from fixedTaskType', () => {
    const { result } = renderHook(() => useChatSession('commit'), { wrapper: makeWrapper() })
    expect(result.current.activeTask).toBe('commit')
  })

  it('defaults activeTask to explain when no fixedTaskType', () => {
    const { result } = renderHook(() => useChatSession(), { wrapper: makeWrapper() })
    expect(result.current.activeTask).toBe('explain')
  })

  it('handleSubmit appends entry with streaming status', () => {
    const { result } = renderHook(() => useChatSession(), { wrapper: makeWrapper() })

    act(() => {
      result.current.handleSubmit('const x = 1', 'explain')
    })

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].assistantMessage.status).toBe('streaming')
    expect(result.current.entries[0].userMessage.content).toBe('const x = 1')
  })

  it('handleCancel sets last entry status to interrupted', () => {
    const { result } = renderHook(() => useChatSession(), { wrapper: makeWrapper() })

    act(() => {
      result.current.handleSubmit('some code', 'explain')
    })

    act(() => {
      result.current.handleCancel()
    })

    expect(result.current.entries[0].assistantMessage.status).toBe('interrupted')
  })

  it('handleClearHistory empties entries', () => {
    vi.mocked(loadHistory).mockReturnValueOnce([
      {
        assistantMessage: { content: '', cost: null, error: null, routingSteps: [], specialist: null, status: 'done' },
        id: '1',
        userMessage: { content: 'test', taskType: 'explain', timestamp: new Date() },
      },
    ])
    const { result } = renderHook(() => useChatSession('explain'), { wrapper: makeWrapper() })

    act(() => {
      result.current.handleClearHistory()
    })

    expect(result.current.entries).toHaveLength(0)
    expect(clearHistory).toHaveBeenCalledWith('explain')
  })

  it('saveHistory side-effect is called when entries change', () => {
    const { result } = renderHook(() => useChatSession(), { wrapper: makeWrapper() })

    act(() => {
      result.current.handleSubmit('code', 'test')
    })

    expect(saveHistory).toHaveBeenCalled()
  })

  it('fixedTaskType locks activeTask despite setActiveTask calls', () => {
    const { result } = renderHook(() => useChatSession('refactor'), { wrapper: makeWrapper() })

    act(() => {
      result.current.setActiveTask('explain' as TaskType)
    })

    expect(result.current.activeTask).toBe('refactor')
  })
})
