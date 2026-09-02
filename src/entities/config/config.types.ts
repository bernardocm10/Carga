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

export type Meal = {
  name: string
  /** quando/como encaixar na rotina, ex: "grab-and-go ao sair de casa" */
  when: string
  kcal: number
  macros: Macros
  /** linhas de composição prática, uma por item ou opção */
  items: string[]
  note?: string
}

export type MicroNote = {
  topic: string
  detail: string
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
  meals: Meal[]
  micronotes: MicroNote[]
}
