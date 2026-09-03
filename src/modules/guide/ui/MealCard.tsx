import type { Meal } from '@/entities/config'
import { LoadBar } from '@/shared/ui/LoadBar'

export function MealCard({ meal }: { meal: Meal }) {
  const { protein, carbs, fat } = meal.macros
  const total = protein * 4 + carbs * 4 + fat * 9 || 1

  return (
    <article className="border-hairline flex flex-col gap-2 border-t pt-3 first:border-t-0 first:pt-0">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-graphite text-sm font-semibold">{meal.name}</h3>
        <span className="shrink-0">
          <span className="font-display text-graphite text-base font-bold">{meal.kcal}</span>
          <span className="text-graphite-soft text-[11px]"> kcal</span>
        </span>
      </header>

      {meal.when !== '' && <p className="text-graphite-soft text-xs">{meal.when}</p>}

      <LoadBar
        segments={[
          { color: 'tatami', pct: ((protein * 4) / total) * 100 },
          { color: 'iron', pct: ((carbs * 4) / total) * 100 },
          { color: 'brass', pct: ((fat * 9) / total) * 100 },
        ]}
      />
      <p className="text-graphite-soft text-[11px]">
        {protein} p · {carbs} c · {fat} g
      </p>

      <ul className="text-graphite flex flex-col gap-1 text-sm">
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
        <p className="border-brass text-graphite-soft border-l-2 pl-2 text-xs">{meal.note}</p>
      )}
    </article>
  )
}
