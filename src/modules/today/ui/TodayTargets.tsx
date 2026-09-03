import { useConfig } from '@/entities/config'
import { LoadBar } from '@/shared/ui/LoadBar'
import { Section } from '@/shared/ui/Page'

export function TodayTargets() {
  const { targetCalories, macros } = useConfig()

  const pKcal = macros.protein * 4
  const cKcal = macros.carbs * 4
  const fKcal = macros.fat * 9
  const total = pKcal + cKcal + fKcal || 1

  return (
    <Section label="meta do dia">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-graphite text-4xl leading-none font-black">
            {targetCalories}
          </span>
          <span className="text-graphite-soft font-display text-base font-bold">kcal</span>
        </div>
        <LoadBar
          segments={[
            { color: 'tatami', pct: (pKcal / total) * 100 },
            { color: 'iron', pct: (cKcal / total) * 100 },
            { color: 'brass', pct: (fKcal / total) * 100 },
          ]}
        />
        <p className="text-graphite-soft text-xs font-medium">
          {macros.protein} p · {macros.carbs} c · {macros.fat} g
        </p>
      </div>
    </Section>
  )
}
