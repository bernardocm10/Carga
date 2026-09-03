import { useState, type FormEvent } from 'react'
import { useWeightLog, useWeightLogStore } from '@/entities/weight-log'
import { toISODate } from '@/shared/date/week'
import { Button } from '@/shared/ui/Button'
import { LedgerSection } from '@/shared/ui/Ledger'
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
    <LedgerSection label="Peso">
      {loggedToday && !editing ? (
        <div className="flex items-baseline justify-between font-mono">
          <span className="text-graphite-soft text-[11px]">registrado hoje</span>
          <span className="text-graphite text-base">
            {String(loggedToday.kg).replace('.', ',')} kg
            <button
              type="button"
              onClick={() => {
                setKg(String(loggedToday.kg).replace('.', ','))
                setEditing(true)
              }}
              className="text-iron ml-3 text-xs underline"
            >
              corrigir
            </button>
          </span>
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
    </LedgerSection>
  )
}
