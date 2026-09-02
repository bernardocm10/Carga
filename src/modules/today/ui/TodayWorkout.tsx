import { trainingDayForDate, useConfig } from '@/entities/config'

export function TodayWorkout() {
  const config = useConfig()
  const day = trainingDayForDate(config, new Date())
  const exercises = day?.exercises ?? []

  return (
    <section className="border-hairline bg-chalk flex flex-col gap-2 rounded border p-4">
      <h2 className="font-display text-graphite-soft text-sm tracking-wide uppercase">
        Treino de hoje
      </h2>

      {exercises.length === 0 ? (
        <p className="font-body text-graphite-soft text-sm">Dia de descanso.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {exercises.map((exercise) => (
            <li
              key={exercise.name}
              className="font-body text-graphite flex items-baseline justify-between gap-2 text-sm"
            >
              <span>{exercise.name}</span>
              <span className="text-graphite-soft shrink-0 font-mono">
                {exercise.sets}×{exercise.reps}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
