import { useState } from 'react'
import { useConfig } from '@/entities/config'
import { AppearanceSection } from './ui/AppearanceSection'
import { MacrosSection } from './ui/MacrosSection'
import { TrainingDayEditor } from './ui/TrainingDayEditor'

export function SettingsScreen() {
  const config = useConfig()
  const days = [...config.trainingSplit]
    .filter((day) => day.weekday !== 0)
    .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7))

  const [openDay, setOpenDay] = useState<number | null>(null)

  return (
    <section className="flex flex-col gap-4 p-4">
      <h1 className="font-display text-graphite text-3xl tracking-wide uppercase">Ajustes</h1>

      <MacrosSection />

      <div className="flex flex-col gap-2">
        {days.map((day) => (
          <TrainingDayEditor
            key={day.weekday}
            day={day}
            open={openDay === day.weekday}
            onToggle={() => setOpenDay((current) => (current === day.weekday ? null : day.weekday))}
          />
        ))}
      </div>

      <AppearanceSection />
    </section>
  )
}
