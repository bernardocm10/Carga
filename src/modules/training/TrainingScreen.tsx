import { useState } from 'react'
import { trainingDayForWeekday, useConfig } from '@/entities/config'
import { toISODate } from '@/shared/date/week'
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
    <section className="flex flex-col gap-4 p-4">
      <h1 className="font-display text-graphite text-3xl tracking-wide uppercase">Treino</h1>

      <DaySelector
        split={config.trainingSplit}
        selectedWeekday={weekday}
        onSelectWeekday={setWeekday}
        date={date}
        onDateChange={setDate}
        today={today}
      />

      {day && day.exercises.length > 0 ? (
        <>
          <p className="font-display text-graphite-soft text-sm tracking-wide uppercase">
            {day.name} · {day.focus}
          </p>
          <div className="flex flex-col gap-3">
            {day.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.name}
                exercise={exercise}
                dayName={day.name}
                date={date}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyDay />
      )}
    </section>
  )
}
