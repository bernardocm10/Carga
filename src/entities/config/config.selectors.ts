import type { Config, TrainingDay } from './config.types'

/** O treino previsto para um dia da semana (0 = domingo ... 6 = sábado). */
export function trainingDayForWeekday(config: Config, weekday: number): TrainingDay | undefined {
  return config.trainingSplit.find((day) => day.weekday === weekday)
}

/** O treino previsto para uma data. */
export function trainingDayForDate(config: Config, date: Date): TrainingDay | undefined {
  return trainingDayForWeekday(config, date.getDay())
}
