import { create } from 'zustand'
import { persist } from '@/shared/db'
import { deleteWeightEntry, loadWeightLog, putWeightEntry } from './weight-log.repo'
import type { WeightEntry } from './weight-log.types'

type WeightLogState = {
  entries: WeightEntry[]
  hydrate: () => Promise<void>
  /** sobrescreve a entrada da mesma data */
  addEntry: (entry: WeightEntry) => void
  removeEntry: (date: string) => void
}

export const useWeightLogStore = create<WeightLogState>((set, get) => ({
  entries: [],
  hydrate: async () => {
    set({ entries: await loadWeightLog() })
  },
  addEntry: (entry) => {
    const next = [...get().entries.filter((e) => e.date !== entry.date), entry].sort((a, b) =>
      a.date.localeCompare(b.date),
    )
    set({ entries: next })
    persist(putWeightEntry(entry))
  },
  removeEntry: (date) => {
    set({ entries: get().entries.filter((e) => e.date !== date) })
    persist(deleteWeightEntry(date))
  },
}))

export const useWeightLog = (): WeightEntry[] => useWeightLogStore((state) => state.entries)
