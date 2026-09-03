import { useState, type FormEvent } from 'react'
import { useWeightLog, useWeightLogStore } from '@/entities/weight-log'
import { toISODate } from '@/shared/date/week'
import { Button } from '@/shared/ui/Button'
import { NumberField } from '@/shared/ui/NumberField'
import { Section } from '@/shared/ui/Page'

export function QuickWeight() {
  const today = toISODate(new Date())
  const entries = useWeightLog()
  const addEntry = useWeightLogStore((state) => state.addEntry)
  const loggedToday = entries.find((entry) => entry.date === today)

  const [editing, setEditing] = useState(false)
  const [kg, setKg] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = Number(kg.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) return
    addEntry({ date: today, kg: value })
    setKg('')
    setEditing(false)
  }

  return (
    <Section label="peso">
      {loggedToday && !editing ? (
        <div className="flex items-baseline gap-2">
          <span className="font-display text-graphite text-4xl leading-none font-black">
            {String(loggedToday.kg).replace('.', ',')}
          </span>
          <span className="text-graphite-soft font-display text-base font-bold">kg</span>
          <button
            type="button"
            onClick={() => {
              setKg(String(loggedToday.kg).replace('.', ','))
              setEditing(true)
            }}
            className="text-iron ml-auto self-center text-xs font-semibold"
          >
            corrigir
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex items-end gap-3">
          <NumberField
            label="kg"
            value={kg}
            onChange={(event) => setKg(event.target.value)}
            placeholder="0,0"
            className="flex-1"
          />
          <Button type="submit">Salvar</Button>
        </form>
      )}
    </Section>
  )
}
