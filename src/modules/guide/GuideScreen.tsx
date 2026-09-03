import { useConfig } from '@/entities/config'
import { LoadBar } from '@/shared/ui/LoadBar'
import { Page, Section } from '@/shared/ui/Page'
import { MealCard } from './ui/MealCard'
import { SWAP_RULES } from './guide.content'

export function GuideScreen() {
  const config = useConfig()
  const meals = config.meals ?? []
  const micronotes = config.micronotes ?? []
  const { protein, carbs, fat } = config.macros
  const total = protein * 4 + carbs * 4 + fat * 9 || 1

  return (
    <Page>
      <h1 className="font-display text-graphite text-4xl leading-none font-black uppercase">
        Guia
      </h1>

      <Section label="metas do dia">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-graphite text-4xl leading-none font-black">
              {config.targetCalories}
            </span>
            <span className="text-graphite-soft font-display text-base font-bold">kcal</span>
          </div>
          <LoadBar
            segments={[
              { color: 'tatami', pct: ((protein * 4) / total) * 100 },
              { color: 'iron', pct: ((carbs * 4) / total) * 100 },
              { color: 'brass', pct: ((fat * 9) / total) * 100 },
            ]}
          />
          <p className="text-graphite-soft text-xs">
            {protein} g proteína · {carbs} g carbo · {fat} g gordura
          </p>
        </div>
      </Section>

      <Section label="cardápio">
        <div className="flex flex-col gap-3">
          {meals.map((meal) => (
            <MealCard key={meal.name} meal={meal} />
          ))}
        </div>
      </Section>

      <Section label="regra de troca">
        <ul className="text-graphite flex flex-col gap-2 text-sm">
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

      <Section label="suplementos">
        <ul className="flex flex-col gap-3">
          {config.supplements.map((supplement) => (
            <li key={supplement.name} className="flex flex-col gap-0.5 text-sm">
              <span className="text-graphite font-semibold">{supplement.name}</span>
              <span className="text-graphite">{supplement.dose}</span>
              <span className="text-graphite-soft text-xs">{supplement.timing}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="micronutrientes">
        <ul className="flex flex-col gap-2 text-sm">
          {micronotes.map((note) => (
            <li key={note.topic}>
              <span className="text-graphite font-semibold">{note.topic}</span>
              <span className="text-graphite-soft"> — {note.detail}</span>
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  )
}
