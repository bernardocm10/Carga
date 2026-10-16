import { useState } from 'react'
import { useConfig } from '@/entities/config'
import { Page, Section } from '@/shared/ui/Page'
import { AppearanceSection } from './ui/AppearanceSection'
import { BackupSection } from './ui/BackupSection'
import { MacrosSection } from './ui/MacrosSection'
import { MealsSection } from './ui/MealsSection'
import { MicroNotesSection } from './ui/MicroNotesSection'
import { TrainingDayEditor } from './ui/TrainingDayEditor'

export function SettingsScreen() {
  const config = useConfig()
  const days = [...config.trainingSplit]
    .filter((day) => day.weekday !== 0)
    .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7))

  const [openDay, setOpenDay] = useState<number | null>(null)

  return (
    <Page>
      <h1 className="font-display text-graphite text-4xl leading-none font-black uppercase">
        Ajustes
      </h1>

      <MacrosSection />
      <MealsSection />
      <MicroNotesSection />

      <Section label="treino">
        <div className="border-hairline flex flex-col border-t">
          {days.map((day) => (
            <TrainingDayEditor
              key={day.weekday}
              day={day}
              open={openDay === day.weekday}
              onToggle={() =>
                setOpenDay((current) => (current === day.weekday ? null : day.weekday))
              }
            />
          ))}
        </div>
      </Section>

      <AppearanceSection />
      <BackupSection />
    </Page>
  )
}
