import { useState } from 'react'
import { trainingDayForWeekday, useConfig } from '@/entities/config'
import { toISODate } from '@/shared/date/week'
import { Page } from '@/shared/ui/Page'
import { DaySelector } from './ui/DaySelector'
import { EmptyDay } from './ui/EmptyDay'
import { ExerciseCard } from './ui/ExerciseCard'

export function TrainingScreen() {
  const config = useConfig()
  const today = toISODate(new Date())
  const [date, setDate] = useState(today)
  const [weekday, setWeekday] = useState(() => new Date().getDay())
  const day = trainingDayForWeekday(config, weekday)

  return (
    <Page>
      <h1 className="font-display text-graphite text-4xl leading-none font-black uppercase">
        Treino
      </h1>

      <DaySelector
        split={config.trainingSplit}
        selectedWeekday={weekday}
        onSelectWeekday={setWeekday}
        date={date}
        onDateChange={setDate}
        today={today}
      />

      {day && day.exercises.length > 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-graphite-soft text-sm font-medium">
            <span className="text-graphite font-semibold">{day.name}</span> · {day.focus}
          </p>
          <ul className="border-hairline flex flex-col border-t">
            {day.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.name}
                exercise={exercise}
                dayName={day.name}
                date={date}
              />
            ))}
          </ul>
        </div>
      ) : (
        <EmptyDay />
      )}
    </Page>
  )
}
