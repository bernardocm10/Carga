import { trainingDayForDate, type Config } from '@/entities/config'
import { lastLoadForExercise, type TrainingSession } from '@/entities/training-log'

export type WorkoutRow = {
  exerciseId: string
  /** alvo da Config, ex. "4×8" */
  target: string
  /** kg do topSet da última sessão que teve o exercício; null sem histórico */
  last: number | null
  /** última carga menos a anterior; null com menos de dois registros */
  delta: number | null
}

export type TodayWorkout = {
  isRest: boolean
  dayName: string | null
  rows: WorkoutRow[]
  /** Σ peso×reps da última sessão desse mesmo dia; null se nunca treinado */
  lastSessionTonnage: number | null
}

export function todayWorkout(
  config: Config,
  sessions: TrainingSession[],
  date: Date,
): TodayWorkout {
  const day = trainingDayForDate(config, date)
  if (day === undefined || day.exercises.length === 0) {
    return { isRest: true, dayName: day?.name ?? null, rows: [], lastSessionTonnage: null }
  }

  const rows = day.exercises.map((exercise): WorkoutRow => {
    const latest = lastLoadForExercise(sessions, exercise.exerciseId)
    let delta: number | null = null
    if (latest !== undefined) {
      const previous = lastLoadForExercise(sessions, exercise.exerciseId, latest.date)
      if (previous !== undefined) delta = latest.topSet.weight - previous.topSet.weight
    }
    return {
      exerciseId: exercise.exerciseId,
      target: `${exercise.sets}×${exercise.reps}`,
      last: latest?.topSet.weight ?? null,
      delta,
    }
  })

  const lastSession = sessions
    .filter((s) => s.dayName === day.name)
    .sort((a, b) => b.date.localeCompare(a.date))
    .at(0)
  const lastSessionTonnage =
    lastSession === undefined
      ? null
      : lastSession.exercises.reduce(
          (total, ex) => total + ex.sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
          0,
        )

  return { isRest: false, dayName: day.name, rows, lastSessionTonnage }
}
