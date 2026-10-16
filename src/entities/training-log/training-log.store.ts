import { create } from 'zustand'
import { persist } from '@/shared/db'
import { deleteSession, loadTrainingLog, putSession } from './training-log.repo'
import type { LoggedSet, TrainingSession } from './training-log.types'

type TrainingLogState = {
  sessions: TrainingSession[]
  hydrate: () => Promise<void>
  logSet: (date: string, dayName: string, exerciseName: string, set: LoggedSet) => void
  removeSet: (date: string, exerciseName: string, index: number) => void
  removeSession: (date: string) => void
}

function byDate(a: TrainingSession, b: TrainingSession): number {
  return a.date.localeCompare(b.date)
}

export const useTrainingLogStore = create<TrainingLogState>((set, get) => ({
  sessions: [],
  hydrate: async () => {
    set({ sessions: await loadTrainingLog() })
  },
  logSet: (date, dayName, exerciseName, newSet) => {
    const sessions = get().sessions
    const current = sessions.find((s) => s.date === date) ?? { date, dayName, exercises: [] }
    const hasExercise = current.exercises.some((e) => e.name === exerciseName)
    const exercises = hasExercise
      ? current.exercises.map((e) =>
          e.name === exerciseName ? { ...e, sets: [...e.sets, newSet] } : e,
        )
      : [...current.exercises, { name: exerciseName, sets: [newSet] }]
    const updated = { ...current, exercises }
    set({ sessions: [...sessions.filter((s) => s.date !== date), updated].sort(byDate) })
    persist(putSession(updated))
  },
  removeSet: (date, exerciseName, index) => {
    const sessions = get().sessions
    const current = sessions.find((s) => s.date === date)
    if (current === undefined) return
    const exercises = current.exercises
      .map((e) =>
        e.name === exerciseName ? { ...e, sets: e.sets.filter((_, i) => i !== index) } : e,
      )
      .filter((e) => e.sets.length > 0)
    const rest = sessions.filter((s) => s.date !== date)
    if (exercises.length === 0) {
      set({ sessions: rest })
      persist(deleteSession(date))
      return
    }
    const updated = { ...current, exercises }
    set({ sessions: [...rest, updated].sort(byDate) })
    persist(putSession(updated))
  },
  removeSession: (date) => {
    set({ sessions: get().sessions.filter((s) => s.date !== date) })
    persist(deleteSession(date))
  },
}))

export const useTrainingLog = (): TrainingSession[] =>
  useTrainingLogStore((state) => state.sessions)
