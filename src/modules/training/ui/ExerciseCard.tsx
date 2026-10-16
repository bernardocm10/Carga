import { useState, type FormEvent } from 'react'
import type { Exercise } from '@/entities/config'
import { exerciseName } from '@/entities/exercise-catalog'
import { useTrainingLog, useTrainingLogStore } from '@/entities/training-log'
import { cn } from '@/shared/lib/cn'
import { useLeave } from '@/shared/lib/useLeave'
import { Button } from '@/shared/ui/Button'
import { NumberField } from '@/shared/ui/NumberField'
import { lastLoadForExercise } from '@/entities/training-log'

function dayMonth(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

type SetChipProps = { label: string; index: number; onRemove: () => void }

function SetChip({ label, index, onRemove }: SetChipProps) {
  const { leaving, leave } = useLeave(onRemove)
  return (
    <li
      className={cn(
        'border-hairline text-graphite flex items-center gap-2 border px-2 py-1 text-sm',
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
      ?.exercises.find((entry) => entry.exerciseId === exercise.exerciseId)?.sets ?? []
  const last = lastLoadForExercise(sessions, exercise.exerciseId, date)

  const add = (event: FormEvent) => {
    event.preventDefault()
    const parsedWeight = Number(weight.replace(',', '.'))
    const parsedReps = Math.round(Number(reps.replace(',', '.')))
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) return
    if (!Number.isFinite(parsedReps) || parsedReps <= 0) return
    logSet(date, dayName, exercise.exerciseId, { weight: parsedWeight, reps: parsedReps })
    setWeight('')
    setReps('')
  }

  return (
    <li className="border-hairline flex flex-col gap-3 border-b py-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-graphite text-sm font-semibold">
          {exerciseName(exercise.exerciseId)}
        </span>
        <span className="text-graphite-soft shrink-0 text-xs">
          {exercise.sets}×{exercise.reps}
        </span>
      </div>

      <p className="text-graphite-soft text-xs">
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
              onRemove={() => removeSet(date, exercise.exerciseId, index)}
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
    </li>
  )
}
