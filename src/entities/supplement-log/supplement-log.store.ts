import { create } from 'zustand'
import { persist } from '@/shared/db'
import { deleteSupplementDay, loadSupplementLog, putSupplementDay } from './supplement-log.repo'
import type { SupplementDay } from './supplement-log.types'

type SupplementLogState = {
  days: SupplementDay[]
  hydrate: () => Promise<void>
  /** alterna um suplemento na data; cria/remove o registro do dia conforme necessário */
  toggle: (date: string, name: string) => void
}

function byDate(a: SupplementDay, b: SupplementDay): number {
  return a.date.localeCompare(b.date)
}

export const useSupplementLogStore = create<SupplementLogState>((set, get) => ({
  days: [],
  hydrate: async () => {
    set({ days: await loadSupplementLog() })
  },
  toggle: (date, name) => {
    const days = get().days
    const current = days.find((d) => d.date === date) ?? { date, taken: [] }
    const taken = current.taken.includes(name)
      ? current.taken.filter((n) => n !== name)
      : [...current.taken, name]
    const rest = days.filter((d) => d.date !== date)
    if (taken.length > 0) {
      const day = { date, taken }
      set({ days: [...rest, day].sort(byDate) })
      persist(putSupplementDay(day))
    } else {
      set({ days: rest })
      persist(deleteSupplementDay(date))
    }
  },
}))

/** referência estável pro caso "nenhum suplemento nessa data" — evita loop de render no seletor */
const NONE: string[] = []

/** Suplementos marcados como tomados numa data. */
export const useTakenOn = (date: string): string[] =>
  useSupplementLogStore((state) => state.days.find((d) => d.date === date)?.taken ?? NONE)
