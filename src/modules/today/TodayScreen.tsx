import { trainingDayForDate, useConfig } from '@/entities/config'
import { LedgerPage } from '@/shared/ui/Ledger'
import { QuickWeight } from './ui/QuickWeight'
import { SupplementChecklist } from './ui/SupplementChecklist'
import { TodayTargets } from './ui/TodayTargets'
import { WeeklyStrip } from './ui/WeeklyStrip'
import { WorkoutLedger } from './ui/WorkoutLedger'

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
    <LedgerPage>
      <header className="flex flex-col gap-0.5">
        <h1 className="font-display text-graphite text-2xl font-semibold">
          {isTrainingDay ? day.name : 'Descanso'}
        </h1>
        <p className="text-graphite-soft font-mono text-xs">{formatDate(today)}</p>
      </header>

      <WeeklyStrip />
      <WorkoutLedger />
      <QuickWeight />
      <TodayTargets />
      <SupplementChecklist />
    </LedgerPage>
  )
}
