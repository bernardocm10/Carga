import { trainingDayForDate, useConfig } from '@/entities/config'
import { QuickWeight } from './ui/QuickWeight'
import { SupplementChecklist } from './ui/SupplementChecklist'
import { TodayTargets } from './ui/TodayTargets'
import { TodayWorkout } from './ui/TodayWorkout'
import { WeeklyStrip } from './ui/WeeklyStrip'

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${WEEKDAYS[date.getDay()]} · ${day}/${month}`
}

export function TodayScreen() {
  const config = useConfig()
  const today = new Date()
  const day = trainingDayForDate(config, today)
  const isTrainingDay = day !== undefined && day.exercises.length > 0

  return (
    <div className="flex flex-col gap-5 p-4">
      <header className="flex flex-col gap-0.5">
        <h1 className="font-display text-graphite text-3xl tracking-wide uppercase">
          {isTrainingDay ? day.name : 'Descanso'}
        </h1>
        <p className="font-body text-graphite-soft text-sm">{formatDate(today)}</p>
      </header>

      <WeeklyStrip />
      <QuickWeight />
      <TodayTargets />
      <TodayWorkout />
      <SupplementChecklist />
    </div>
  )
}
