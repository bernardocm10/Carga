import type { LoggedSet, TrainingSession } from '@/entities/training-log'

export type LastLoad = {
  date: string
  sets: LoggedSet[]
  /** série mais pesada da sessão; desempate por mais reps */
  topSet: LoggedSet
}

/**
 * Última sessão registrada que contém o exercício com ao menos uma série.
 * `before` descarta sessões nessa data ou depois, pra a sessão em andamento não se ofuscar.
 */
export function lastLoadForExercise(
  sessions: TrainingSession[],
  exerciseName: string,
  before?: string,
): LastLoad | undefined {
  const latest = sessions
    .filter((s) => before === undefined || s.date < before)
    .map((s) => ({
      date: s.date,
      sets: s.exercises.find((e) => e.name === exerciseName)?.sets ?? [],
    }))
    .filter((s) => s.sets.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .at(0)

  if (latest === undefined) return undefined

  const topSet = latest.sets.reduce((best, set) =>
    set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps) ? set : best,
  )
  return { date: latest.date, sets: latest.sets, topSet }
}
