import { renderHook, act } from '@testing-library/react'

import type { ConversationEntry, TaskType } from '@/lib/schemas/route'

import { useChatSession } from '@/hooks/use-chat-session'
import { getModelForTask, loadModelConfig } from '@/lib/config/model-config'
import { buildRouteMutationOptions } from '@/lib/services/route.service'
import { resetStore } from '@/lib/stores/chat-store'
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
    mutationFn: vi.fn().mockResolvedValue(),
    mutationKey: ['route'],
  })),
}))

vi.mock(import('@/lib/config/model-config'), () => ({
  DEFAULTS: {
    analystModel: 'analyst-model',
    commitModel: 'commit-model',
    deadCodeModel: 'dead-code-model',
    docstringModel: 'docstring-model',
    errorExplainModel: 'error-explain-model',
    explainModel: 'explain-model',
    namingHelperModel: 'naming-helper-model',
    ollamaBaseUrl: 'http://localhost:11434',
    performanceHintModel: 'performance-hint-model',
    refactorModel: 'refactor-model',
    testModel: 'test-model',
    translateModel: 'translate-model',
    typeHintsModel: 'type-hints-model',
  },
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

describe('useChatSession', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
    vi.mocked(loadHistory).mockReturnValue([])
    vi.mocked(getModelForTask).mockReturnValue('test-model')
    vi.mocked(loadModelConfig).mockReturnValue({
      analystModel: 'analyst-model',
      commitModel: 'commit-model',
      deadCodeModel: 'dead-code-model',
      docstringModel: 'docstring-model',
      errorExplainModel: 'error-explain-model',
      explainModel: 'explain-model',
      namingHelperModel: 'naming-helper-model',
      ollamaBaseUrl: 'http://localhost:11434',
      performanceHintModel: 'performance-hint-model',
      refactorModel: 'refactor-model',
      testModel: 'test-model',
      translateModel: 'translate-model',
      typeHintsModel: 'type-hints-model',
    })
    vi.mocked(buildRouteMutationOptions).mockReturnValue({
      mutationFn: vi.fn().mockResolvedValue(),
      mutationKey: ['route'],
    })
  })

  it('initialises entries from loadHistory', () => {
    const mockEntry: ConversationEntry = {
      assistantMessage: { content: 'hi', cost: null, error: null, routingSteps: [], specialist: null, status: 'done' },
      id: '1',
      userMessage: { content: 'hello', taskType: 'explain', timestamp: new Date() },
    }
    vi.mocked(loadHistory).mockReturnValueOnce([mockEntry])

    const { result } = renderHook(() => useChatSession('explain'))
    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].id).toBe('1')
  })

  it('initialises activeTask from fixedTaskType', () => {
    const { result } = renderHook(() => useChatSession('commit'))
    expect(result.current.activeTask).toBe('commit')
  })

  it('defaults activeTask to explain when no fixedTaskType', () => {
    const { result } = renderHook(() => useChatSession())
    expect(result.current.activeTask).toBe('explain')
  })

  it('handleSubmit appends entry with streaming status', () => {
    const { result } = renderHook(() => useChatSession())

    act(() => {
      result.current.handleSubmit('const x = 1', 'explain')
    })

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].assistantMessage.status).toBe('streaming')
    expect(result.current.entries[0].userMessage.content).toBe('const x = 1')
  })

  it('handleCancel sets last entry status to interrupted', () => {
    vi.mocked(buildRouteMutationOptions).mockReturnValueOnce({
      mutationFn: vi.fn(() => new Promise<void>(() => {})),
      mutationKey: ['route'],
    })
    const { result } = renderHook(() => useChatSession())

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
    const { result } = renderHook(() => useChatSession('explain'))

    act(() => {
      result.current.handleClearHistory()
    })

    expect(result.current.entries).toHaveLength(0)
    expect(clearHistory).toHaveBeenCalledWith('explain')
  })

  it('saveHistory side-effect is called when entries change', () => {
    const { result } = renderHook(() => useChatSession())

    act(() => {
      result.current.handleSubmit('code', 'test')
    })

    expect(saveHistory).toHaveBeenCalled()
  })

  it('fixedTaskType locks activeTask despite setActiveTask calls', () => {
    const { result } = renderHook(() => useChatSession('refactor'))

    act(() => {
      result.current.setActiveTask('explain' as TaskType)
    })

    expect(result.current.activeTask).toBe('refactor')
  })
})
