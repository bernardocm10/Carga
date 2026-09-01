import { create } from 'zustand'
import { loadTrainingLog, saveTrainingLog } from './training-log.repo'
import type { LoggedSet, TrainingSession } from './training-log.types'

type TrainingLogState = {
  sessions: TrainingSession[]
  logSet: (date: string, dayName: string, exerciseName: string, set: LoggedSet) => void
  removeSet: (date: string, exerciseName: string, index: number) => void
  removeSession: (date: string) => void
}

function byDate(a: TrainingSession, b: TrainingSession): number {
  return a.date.localeCompare(b.date)
}

export const useTrainingLogStore = create<TrainingLogState>((set, get) => ({
  sessions: loadTrainingLog(),
  logSet: (date, dayName, exerciseName, newSet) => {
    const sessions = get().sessions
    const current = sessions.find((s) => s.date === date) ?? { date, dayName, exercises: [] }
    const hasExercise = current.exercises.some((e) => e.name === exerciseName)
    const exercises = hasExercise
      ? current.exercises.map((e) =>
          e.name === exerciseName ? { ...e, sets: [...e.sets, newSet] } : e,
        )
      : [...current.exercises, { name: exerciseName, sets: [newSet] }]
    const next = [...sessions.filter((s) => s.date !== date), { ...current, exercises }].sort(
      byDate,
    )
    saveTrainingLog(next)
    set({ sessions: next })
  },
  removeSet: (date, exerciseName, index) => {
    const next = get()
      .sessions.map((s) => {
        if (s.date !== date) return s
        const exercises = s.exercises
          .map((e) =>
            e.name === exerciseName ? { ...e, sets: e.sets.filter((_, i) => i !== index) } : e,
          )
          .filter((e) => e.sets.length > 0)
        return { ...s, exercises }
      })
      .filter((s) => s.exercises.length > 0)
    saveTrainingLog(next)
    set({ sessions: next })
  },
  removeSession: (date) => {
    const next = get().sessions.filter((s) => s.date !== date)
    saveTrainingLog(next)
    set({ sessions: next })
  },
}))

export const useTrainingLog = (): TrainingSession[] =>
  useTrainingLogStore((state) => state.sessions)
