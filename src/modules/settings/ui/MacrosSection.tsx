import type { Macros } from '@/entities/config'
import { useConfig, useConfigStore } from '@/entities/config'
import { LoadBar } from '@/shared/ui/LoadBar'
import { Section } from '@/shared/ui/Page'
import { setCalories, setMacro } from '../domain/editConfig'
import { NumberEditor } from './NumberEditor'

const MACROS: Array<[keyof Macros, string]> = [
  ['protein', 'Proteína (g)'],
  ['carbs', 'Carbo (g)'],
  ['fat', 'Gordura (g)'],
]

export function MacrosSection() {
  const config = useConfig()
  const updateConfig = useConfigStore((state) => state.updateConfig)
  const { protein, carbs, fat } = config.macros

  const pKcal = protein * 4
  const cKcal = carbs * 4
  const fKcal = fat * 9
  const total = pKcal + cKcal + fKcal || 1

  return (
    <Section label="dieta">
      <div className="flex flex-col gap-3">
        <NumberEditor
          label="Calorias (kcal)"
          initial={config.targetCalories}
          min={1}
          onCommit={(value) => updateConfig(setCalories(config, value))}
        />
        <LoadBar
          segments={[
            { color: 'tatami', pct: (pKcal / total) * 100 },
            { color: 'iron', pct: (cKcal / total) * 100 },
            { color: 'brass', pct: (fKcal / total) * 100 },
          ]}
        />
        <div className="grid grid-cols-3 gap-2">
          {MACROS.map(([key, label]) => (
            <NumberEditor
              key={key}
              label={label}
              initial={config.macros[key]}
              min={0}
              onCommit={(value) => updateConfig(setMacro(config, key, value))}
            />
          ))}
        </div>
      </div>
    </Section>
  )
}
