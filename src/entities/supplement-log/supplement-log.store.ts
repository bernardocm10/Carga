import { create } from 'zustand'
import { loadSupplementLog, saveSupplementLog } from './supplement-log.repo'
import type { SupplementDay } from './supplement-log.types'

type SupplementLogState = {
  days: SupplementDay[]
  /** alterna um suplemento na data; cria/remove o registro do dia conforme necessário */
  toggle: (date: string, name: string) => void
}

function byDate(a: SupplementDay, b: SupplementDay): number {
  return a.date.localeCompare(b.date)
}

export const useSupplementLogStore = create<SupplementLogState>((set, get) => ({
  days: loadSupplementLog(),
  toggle: (date, name) => {
    const days = get().days
    const current = days.find((d) => d.date === date) ?? { date, taken: [] }
    const taken = current.taken.includes(name)
      ? current.taken.filter((n) => n !== name)
      : [...current.taken, name]
    const rest = days.filter((d) => d.date !== date)
    const next = (taken.length > 0 ? [...rest, { date, taken }] : rest).sort(byDate)
    saveSupplementLog(next)
    set({ days: next })
  },
}))

/** referência estável pro caso "nenhum suplemento nessa data" — evita loop de render no seletor */
const NONE: string[] = []

/** Suplementos marcados como tomados numa data. */
export const useTakenOn = (date: string): string[] =>
  useSupplementLogStore((state) => state.days.find((d) => d.date === date)?.taken ?? NONE)
