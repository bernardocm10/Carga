import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/ui/Button'
import { NumberField } from '@/shared/ui/NumberField'
import { toISODate } from '@/shared/date/week'
import { useWeightLogStore } from '@/entities/weight-log'

export function WeightForm() {
  const addEntry = useWeightLogStore((state) => state.addEntry)
  const today = toISODate(new Date())
  const [date, setDate] = useState(today)
  const [kg, setKg] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = Number(kg.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) return
    addEntry({ date, kg: value })
    setKg('')
    setDate(today)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <NumberField
          label="Peso (kg)"
          value={kg}
          onChange={(event) => setKg(event.target.value)}
          placeholder="0,0"
          className="flex-1"
        />
        <label htmlFor="weight-date" className="flex flex-1 flex-col gap-1">
          <span className="font-display text-graphite-soft text-xs tracking-wide uppercase">
            Data
          </span>
          <input
            id="weight-date"
            type="date"
            value={date}
            max={today}
            onChange={(event) => setDate(event.target.value)}
            className="border-hairline bg-chalk text-graphite focus:border-iron border px-3 py-2 text-sm focus:outline-none"
          />
        </label>
      </div>
      <Button type="submit" className="self-start">
        Salvar
      </Button>
    </form>
  )
}
