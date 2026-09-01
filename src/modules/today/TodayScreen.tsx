import { trainingDayForDate, useConfig } from '@/entities/config'

export function TodayScreen() {
  const config = useConfig()
  const today = new Date()
  const day = trainingDayForDate(config, today)

  return (
    <section className="flex flex-col gap-4 p-4">
      <header>
        <h1 className="font-display text-3xl uppercase tracking-wide text-graphite">
          {day ? day.name : 'Hoje'}
        </h1>
        <p className="font-body text-sm text-graphite-soft">{day?.focus}</p>
      </header>

      <div className="rounded border border-hairline bg-chalk p-4">
        <p className="font-mono text-2xl text-iron">{config.targetCalories} kcal</p>
        <p className="font-body text-sm text-graphite-soft">
          {config.macros.protein}g P · {config.macros.carbs}g C · {config.macros.fat}g F
        </p>
      </div>
    </section>
  )
}
