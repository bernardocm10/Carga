import { create } from 'zustand'
import { loadWeightLog, saveWeightLog } from './weight-log.repo'
import type { WeightEntry } from './weight-log.types'

type WeightLogState = {
  entries: WeightEntry[]
  /** sobrescreve a entrada da mesma data */
  addEntry: (entry: WeightEntry) => void
  removeEntry: (date: string) => void
}

export const useWeightLogStore = create<WeightLogState>((set, get) => ({
  entries: loadWeightLog(),
  addEntry: (entry) => {
    const next = [...get().entries.filter((e) => e.date !== entry.date), entry].sort((a, b) =>
      a.date.localeCompare(b.date),
    )
    saveWeightLog(next)
    set({ entries: next })
  },
  removeEntry: (date) => {
    const next = get().entries.filter((e) => e.date !== date)
    saveWeightLog(next)
    set({ entries: next })
  },
}))

export const useWeightLog = (): WeightEntry[] => useWeightLogStore((state) => state.entries)
