import type { Config } from '@/entities/config'
import { trainingDayForWeekday } from '@/entities/config'
import type { TrainingSession } from '@/entities/training-log'
import { toISODate, weekDates } from '@/shared/date/week'

export type DayStatus = {
  /** ISO `YYYY-MM-DD` */
  date: string
  /** dia da semana no padrão JS: 0 = domingo … 6 = sábado */
  weekday: number
  /** rótulo curto PT-BR */
  label: string
  isToday: boolean
  hasSession: boolean
  isTrainingDay: boolean
}

const LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

/** Estado dos 7 dias da semana que contém `today`, de segunda a domingo. */
export function weekStatus(sessions: TrainingSession[], config: Config, today: Date): DayStatus[] {
  const todayIso = toISODate(today)
  return weekDates(today).map((date, index) => {
    const weekday = (index + 1) % 7
    return {
      date,
      weekday,
      label: LABELS[index] ?? '',
      isToday: date === todayIso,
      hasSession: sessions.some((session) => session.date === date),
      isTrainingDay: (trainingDayForWeekday(config, weekday)?.exercises.length ?? 0) > 0,
    }
  })
}
