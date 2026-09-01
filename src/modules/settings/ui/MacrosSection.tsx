import { useState } from 'react'
import type { Macros } from '@/entities/config'
import { useConfig, useConfigStore } from '@/entities/config'
import { cn } from '@/shared/lib/cn'
import { useSavedFlash } from '@/shared/lib/useSavedFlash'
import { NumberField } from '@/shared/ui/NumberField'
import { setCalories, setMacro } from '../domain/editConfig'

type EditorProps = {
  label: string
  initial: number
  min: number
  onCommit: (value: number) => void
}

function NumberEditor({ label, initial, min, onCommit }: EditorProps) {
  const [text, setText] = useState(String(initial))
  const [saved, flash] = useSavedFlash()
  const commit = () => {
    const value = Math.round(Number(text.replace(',', '.')))
    if (!Number.isFinite(value) || value < min) {
      setText(String(initial))
      return
    }
    onCommit(value)
    flash()
  }
  return (
    <NumberField
      label={label}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      className={cn(saved && 'cg-saved')}
    />
  )
}

const MACROS: Array<[keyof Macros, string]> = [
  ['protein', 'Proteína (g)'],
  ['carbs', 'Carbo (g)'],
  ['fat', 'Gordura (g)'],
]

export function MacrosSection() {
  const config = useConfig()
  const updateConfig = useConfigStore((state) => state.updateConfig)

  return (
    <div className="border-hairline bg-chalk flex flex-col gap-3 rounded border p-4">
      <h2 className="font-display text-graphite text-lg tracking-wide uppercase">Metas do dia</h2>
      <NumberEditor
        label="Calorias (kcal)"
        initial={config.targetCalories}
        min={1}
        onCommit={(value) => updateConfig(setCalories(config, value))}
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
  )
}
