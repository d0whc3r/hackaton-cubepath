import type { TaskType } from '@/lib/schemas/route'
import {
  DEFAULTS,
  MODEL_CONFIG_UPDATED_EVENT,
  getAnalystModel,
  getModelForTask,
  getTranslateModel,
  loadModelConfig,
  removeModelConfig,
  saveModelConfig,
  STORAGE_KEY,
} from '@/lib/config/model-config'

describe('loadModelConfig', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns DEFAULTS when window is undefined (SSR)', () => {
    const original = globalThis.window
    Object.defineProperty(globalThis, 'window', { configurable: true, value: undefined })
    const result = loadModelConfig()
    expect(result).toEqual(DEFAULTS)
    Object.defineProperty(globalThis, 'window', { configurable: true, value: original })
  })

  it('returns DEFAULTS when localStorage has no entry', () => {
    vi.spyOn(localStorage, 'getItem').mockReturnValue(null)
    expect(loadModelConfig()).toEqual(DEFAULTS)
  })

  it('merges stored values over DEFAULTS', () => {
    const stored = { explainModel: 'custom-model' }
    vi.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify(stored))
    const result = loadModelConfig()
    expect(result.explainModel).toBe('custom-model')
    expect(result.analystModel).toBe(DEFAULTS.analystModel)
  })

  it('returns DEFAULTS on JSON parse error', () => {
    vi.spyOn(localStorage, 'getItem').mockReturnValue('not-valid-json{{{')
    expect(loadModelConfig()).toEqual(DEFAULTS)
  })

  it('uses STORAGE_KEY to look up localStorage', () => {
    const spy = vi.spyOn(localStorage, 'getItem').mockReturnValue(null)
    loadModelConfig()
    expect(spy).toHaveBeenCalledWith(STORAGE_KEY)
  })
})

describe('config persistence events', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('dispatches MODEL_CONFIG_UPDATED_EVENT after saveModelConfig', async () => {
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent')
    await saveModelConfig({ ...DEFAULTS, explainModel: 'custom-model' })

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: MODEL_CONFIG_UPDATED_EVENT }))
  })

  it('dispatches MODEL_CONFIG_UPDATED_EVENT after removeModelConfig', async () => {
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent')
    await removeModelConfig()

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: MODEL_CONFIG_UPDATED_EVENT }))
  })
})

describe('getModelForTask', () => {
  const tasks: TaskType[] = ['explain', 'test', 'refactor', 'commit']

  it.each(tasks)('returns correct model key for %s task', (task) => {
    const result = getModelForTask(DEFAULTS, task)
    expectTypeOf(result).toBeString()
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns explainModel for explain task', () => {
    expect(getModelForTask(DEFAULTS, 'explain')).toBe(DEFAULTS.explainModel)
  })

  it('returns testModel for test task', () => {
    expect(getModelForTask(DEFAULTS, 'test')).toBe(DEFAULTS.testModel)
  })

  it('returns refactorModel for refactor task', () => {
    expect(getModelForTask(DEFAULTS, 'refactor')).toBe(DEFAULTS.refactorModel)
  })

  it('returns commitModel for commit task', () => {
    expect(getModelForTask(DEFAULTS, 'commit')).toBe(DEFAULTS.commitModel)
  })
})

describe('getAnalystModel', () => {
  it('returns analystModel from config', () => {
    expect(getAnalystModel(DEFAULTS)).toBe(DEFAULTS.analystModel)
  })
})

describe('getTranslateModel', () => {
  it('returns translateModel from config', () => {
    expect(getTranslateModel(DEFAULTS)).toBe(DEFAULTS.translateModel)
  })
})
