import { useState, type FormEvent } from 'react'
import { useWeightLog, useWeightLogStore } from '@/entities/weight-log'
import { toISODate } from '@/shared/date/week'
import { Button } from '@/shared/ui/Button'
import { NumberField } from '@/shared/ui/NumberField'

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
    <section className="border-iron bg-chalk flex flex-col gap-2 rounded border border-l-2 p-4">
      <h2 className="font-display text-graphite-soft text-sm tracking-wide uppercase">
        Peso de hoje
      </h2>

      {loggedToday && !editing ? (
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-graphite text-2xl">
            {String(loggedToday.kg).replace('.', ',')} kg
          </span>
          <button
            type="button"
            onClick={() => {
              setKg(String(loggedToday.kg).replace('.', ','))
              setEditing(true)
            }}
            className="font-body text-graphite-soft hover:text-graphite text-sm underline"
          >
            corrigir
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex items-end gap-2">
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
    </section>
  )
}
