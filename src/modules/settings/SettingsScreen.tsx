import { useConfig } from '@/entities/config'
import { MacrosSection } from './ui/MacrosSection'
import { TrainingDayEditor } from './ui/TrainingDayEditor'

export function SettingsScreen() {
  const config = useConfig()
  const days = [...config.trainingSplit]
    .filter((day) => day.weekday !== 0)
    .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7))

  return (
    <section className="flex flex-col gap-4 p-4">
      <h1 className="font-display text-graphite text-3xl tracking-wide uppercase">Ajustes</h1>
      <MacrosSection />
      {days.map((day) => (
        <TrainingDayEditor key={day.weekday} day={day} />
      ))}
    </section>
  )
}
