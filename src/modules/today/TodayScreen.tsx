import { trainingDayForDate, useConfig } from '@/entities/config'
import { Page } from '@/shared/ui/Page'
import { QuickWeight } from './ui/QuickWeight'
import { SupplementChecklist } from './ui/SupplementChecklist'
import { TodayTargets } from './ui/TodayTargets'
import { WeeklyStrip } from './ui/WeeklyStrip'
import { WorkoutList } from './ui/WorkoutList'

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
    <Page>
      <p className="text-graphite-soft text-sm font-medium">
        {formatDate(today)}
        {isTrainingDay && (
          <>
            {' · '}
            <span className="text-graphite font-semibold">{day.name}</span>
          </>
        )}
      </p>

      <WeeklyStrip />
      <WorkoutList />
      <QuickWeight />
      <TodayTargets />
      <SupplementChecklist />
    </Page>
  )
}
