export type LoggedSet = { weight: number; reps: number }

export type LoggedExercise = { name: string; sets: LoggedSet[] }

export type TrainingSession = {
  /** ISO `YYYY-MM-DD` */
  date: string
  /** nome do TrainingDay no momento do registro, não referência viva à Config */
  dayName: string
  exercises: LoggedExercise[]
}
