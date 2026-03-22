import { readStorage, removeStorage, writeStorage } from '@/lib/utils/storage'

const SAVINGS_KEY = 'slm-router-savings'

export interface SavingsData {
  totalSavedUsd: number
  queryCount: number
  totalInputTokens: number
  totalOutputTokens: number
}

const EMPTY: SavingsData = { queryCount: 0, totalInputTokens: 0, totalOutputTokens: 0, totalSavedUsd: 0 }

export function loadSavings(): SavingsData {
  const result = readStorage<SavingsData>(SAVINGS_KEY, { defaultValue: { ...EMPTY } })
  return result.ok && result.value ? result.value : { ...EMPTY }
}

export function addSaving(savedUsd: number, inputTokens: number, outputTokens: number): SavingsData {
  const current = loadSavings()
  const updated: SavingsData = {
    queryCount: current.queryCount + 1,
    totalInputTokens: current.totalInputTokens + inputTokens,
    totalOutputTokens: current.totalOutputTokens + outputTokens,
    totalSavedUsd: current.totalSavedUsd + savedUsd,
  }
  writeStorage(SAVINGS_KEY, updated)
  globalThis.dispatchEvent(new CustomEvent('slm-savings-updated', { detail: updated }))
  return updated
}

export function resetSavings(): void {
  removeStorage(SAVINGS_KEY)
  globalThis.dispatchEvent(new CustomEvent('slm-savings-updated', { detail: { ...EMPTY } }))
}
