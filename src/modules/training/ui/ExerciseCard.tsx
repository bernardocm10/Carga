import { useState, type FormEvent } from 'react'
import type { Exercise } from '@/entities/config'
import { useTrainingLog, useTrainingLogStore } from '@/entities/training-log'
import { cn } from '@/shared/lib/cn'
import { useLeave } from '@/shared/lib/useLeave'
import { Button } from '@/shared/ui/Button'
import { NumberField } from '@/shared/ui/NumberField'
import { lastLoadForExercise } from '../domain/lastLoad'

function dayMonth(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

type SetChipProps = { label: string; index: number; onRemove: () => void }

function SetChip({ label, index, onRemove }: SetChipProps) {
  const { leaving, leave } = useLeave(onRemove)
  return (
    <li
      className={cn(
        'border-hairline text-graphite flex items-center gap-2 rounded border px-2 py-1 font-mono text-sm',
        leaving ? 'cg-leave' : 'cg-enter',
      )}
    >
      {label}
      <button
        type="button"
        aria-label={`Remover série ${index + 1}`}
        onClick={leave}
        className="text-graphite-soft hover:text-rust transition-colors active:scale-90"
      >
        ×
      </button>
    </li>
  )
}

type Props = {
  exercise: Exercise
  dayName: string
  date: string
}

export function ExerciseCard({ exercise, dayName, date }: Props) {
  const sessions = useTrainingLog()
  const logSet = useTrainingLogStore((state) => state.logSet)
  const removeSet = useTrainingLogStore((state) => state.removeSet)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')

  const loggedSets =
    sessions
      .find((session) => session.date === date)
      ?.exercises.find((entry) => entry.name === exercise.name)?.sets ?? []
  const last = lastLoadForExercise(sessions, exercise.name, date)

  const add = (event: FormEvent) => {
    event.preventDefault()
    const parsedWeight = Number(weight.replace(',', '.'))
    const parsedReps = Math.round(Number(reps.replace(',', '.')))
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) return
    if (!Number.isFinite(parsedReps) || parsedReps <= 0) return
    logSet(date, dayName, exercise.name, { weight: parsedWeight, reps: parsedReps })
    setWeight('')
    setReps('')
  }

  return (
    <div className="border-hairline bg-chalk flex flex-col gap-3 rounded border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display text-graphite text-lg tracking-wide uppercase">
          {exercise.name}
        </span>
        <span className="text-graphite-soft font-mono text-sm">
          {exercise.sets}×{exercise.reps}
        </span>
      </div>

      <p className="font-body text-graphite-soft text-xs">
        {last
          ? `última vez ${dayMonth(last.date)} · ${last.topSet.weight}kg × ${last.topSet.reps}`
          : 'primeira vez'}
      </p>

      {loggedSets.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {loggedSets.map((set, index) => (
            <SetChip
              key={index}
              index={index}
              label={`${set.weight}kg × ${set.reps}`}
              onRemove={() => removeSet(date, exercise.name, index)}
            />
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex items-end gap-2">
        <NumberField
          label="Peso"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          placeholder="0"
          className="flex-1"
        />
        <NumberField
          label="Reps"
          value={reps}
          onChange={(event) => setReps(event.target.value)}
          placeholder="0"
          className="flex-1"
        />
        <Button type="submit" className="px-3">
          +
        </Button>
      </form>
    </div>
  )
}
