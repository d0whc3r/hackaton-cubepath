import { getStorageEngine } from '@/lib/storage/engine'

const SAVINGS_KEY = 'slm-router-savings'
const engine = getStorageEngine('settings')

export interface SavingsData {
  totalSavedUsd: number
  queryCount: number
  totalInputTokens: number
  totalOutputTokens: number
}

const EMPTY: SavingsData = { queryCount: 0, totalInputTokens: 0, totalOutputTokens: 0, totalSavedUsd: 0 }

function dispatch(data: SavingsData): void {
  globalThis.dispatchEvent(new CustomEvent('slm-savings-updated', { detail: data }))
}

export async function loadSavings(): Promise<SavingsData> {
  return (await engine.read<SavingsData>(SAVINGS_KEY)) ?? { ...EMPTY }
}

export async function addSaving(savedUsd: number, inputTokens: number, outputTokens: number): Promise<void> {
  const current = await loadSavings()
  const updated: SavingsData = {
    queryCount: current.queryCount + 1,
    totalInputTokens: current.totalInputTokens + inputTokens,
    totalOutputTokens: current.totalOutputTokens + outputTokens,
    totalSavedUsd: current.totalSavedUsd + savedUsd,
  }
  await engine.write(SAVINGS_KEY, updated)
  dispatch(updated)
}

export async function resetSavings(): Promise<void> {
  await engine.remove(SAVINGS_KEY)
  dispatch({ ...EMPTY })
}
