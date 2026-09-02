import { useConfig } from '@/entities/config'

export function TodayTargets() {
  const config = useConfig()

  return (
    <section className="border-hairline bg-chalk flex flex-col gap-1 rounded border p-4">
      <h2 className="font-display text-graphite-soft text-sm tracking-wide uppercase">
        Meta do dia
      </h2>
      <p className="font-display text-iron text-2xl">{config.targetCalories} kcal</p>
      <p className="text-graphite-soft font-mono text-sm">
        {config.macros.protein}g P · {config.macros.carbs}g C · {config.macros.fat}g G
      </p>
    </section>
  )
}
