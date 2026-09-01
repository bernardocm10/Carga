export type Macros = {
  protein: number
  carbs: number
  fat: number
}

export type Supplement = {
  name: string
  dose: string
  timing: string
}

export type Exercise = {
  name: string
  sets: number
  /** faixa de repetições como texto livre, ex: "4-6" */
  reps: string
}

export type TrainingDay = {
  /** dia da semana no padrão JS: 0 = domingo ... 6 = sábado */
  weekday: number
  name: string
  focus: string
  exercises: Exercise[]
}

export type Config = {
  targetCalories: number
  macros: Macros
  /** meta mínima de ganho semanal, em gramas */
  weightGoalMinG: number
  /** meta máxima de ganho semanal, em gramas */
  weightGoalMaxG: number
  /** % semanal que dispara o alerta de "rápido demais" */
  weightAlertPct: number
  supplements: Supplement[]
  trainingSplit: TrainingDay[]
}
