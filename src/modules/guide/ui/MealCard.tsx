import type { Meal } from '@/entities/config'

export function MealCard({ meal }: { meal: Meal }) {
  return (
    <article className="border-hairline bg-chalk flex flex-col gap-2 rounded border p-4">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-graphite text-lg tracking-wide uppercase">{meal.name}</h3>
        <span className="text-graphite-soft shrink-0 font-mono text-sm">{meal.kcal} kcal</span>
      </header>

      <p className="font-body text-graphite-soft text-xs">{meal.when}</p>

      <p className="text-graphite-soft font-mono text-xs">
        P {meal.macros.protein}g · C {meal.macros.carbs}g · G {meal.macros.fat}g
      </p>

      <ul className="font-body text-graphite flex flex-col gap-1 text-sm">
        {meal.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-graphite-soft" aria-hidden>
              ·
            </span>
            {item}
          </li>
        ))}
      </ul>

      {meal.note !== undefined && (
        <p className="border-brass font-body text-graphite-soft border-l-2 pl-2 text-xs">
          {meal.note}
        </p>
      )}
    </article>
  )
}
