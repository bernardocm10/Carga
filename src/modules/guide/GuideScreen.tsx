import type { ReactNode } from 'react'
import { useConfig } from '@/entities/config'
import { MealCard } from './ui/MealCard'
import { SWAP_RULES } from './guide.content'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-graphite-soft text-sm tracking-wide uppercase">{title}</h2>
      {children}
    </section>
  )
}

export function GuideScreen() {
  const config = useConfig()
  const meals = config.meals ?? []
  const micronotes = config.micronotes ?? []

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="font-display text-graphite text-3xl tracking-wide uppercase">Guia</h1>

      <Section title="Metas do dia">
        <div className="border-hairline bg-chalk flex flex-col gap-1 rounded border p-4">
          <p className="font-display text-graphite text-3xl">{config.targetCalories} kcal</p>
          <p className="text-graphite-soft font-mono text-sm">
            Proteína {config.macros.protein}g · Carbo {config.macros.carbs}g · Gordura{' '}
            {config.macros.fat}g
          </p>
        </div>
      </Section>

      <Section title="Cardápio">
        {meals.map((meal) => (
          <MealCard key={meal.name} meal={meal} />
        ))}
      </Section>

      <Section title="Regra de troca">
        <ul className="border-hairline bg-chalk font-body text-graphite flex flex-col gap-2 rounded border p-4 text-sm">
          {SWAP_RULES.map((rule) => (
            <li key={rule} className="flex gap-2">
              <span className="text-graphite-soft" aria-hidden>
                ·
              </span>
              {rule}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Suplementos">
        <ul className="border-hairline bg-chalk flex flex-col gap-3 rounded border p-4">
          {config.supplements.map((supplement) => (
            <li key={supplement.name} className="font-body flex flex-col gap-0.5 text-sm">
              <span className="font-display text-graphite tracking-wide uppercase">
                {supplement.name}
              </span>
              <span className="text-graphite">{supplement.dose}</span>
              <span className="text-graphite-soft text-xs">{supplement.timing}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Micronutrientes">
        <ul className="border-hairline bg-chalk flex flex-col gap-3 rounded border p-4">
          {micronotes.map((note) => (
            <li key={note.topic} className="font-body text-sm">
              <span className="font-display text-graphite tracking-wide uppercase">
                {note.topic}
              </span>
              <span className="text-graphite-soft"> — {note.detail}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
