import type { Exercise } from '@/entities/config'
import { exerciseName } from '@/entities/exercise-catalog'
import { cn } from '@/shared/lib/cn'
import { useLeave } from '@/shared/lib/useLeave'

type Props = {
  exercise: Exercise
  canMoveUp: boolean
  canMoveDown: boolean
  onPatch: (patch: Partial<Exercise>) => void
  onChangeExercise: () => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

const NUM_FIELD =
  'border-hairline bg-chalk text-graphite focus:border-iron w-full rounded border py-1 text-center font-mono text-sm focus:outline-none'

export function ExerciseRow({
  exercise,
  canMoveUp,
  canMoveDown,
  onPatch,
  onChangeExercise,
  onRemove,
  onMove,
}: Props) {
  const { leaving, leave } = useLeave(onRemove)
  const name = exerciseName(exercise.exerciseId)

  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_2.5rem_4rem_4.5rem] items-center gap-2 py-1.5',
        leaving ? 'cg-leave' : 'cg-enter',
      )}
    >
      <button
        type="button"
        aria-label={`Trocar exercício ${name}`}
        onClick={onChangeExercise}
        className="text-graphite hover:bg-chalk font-body min-w-0 truncate rounded px-1 py-1 text-left text-sm"
      >
        {name}
      </button>

      <input
        aria-label="Séries"
        inputMode="numeric"
        defaultValue={exercise.sets}
        className={NUM_FIELD}
        onBlur={(event) => {
          const value = Math.round(Number(event.target.value))
          if (Number.isFinite(value) && value > 0) {
            if (value !== exercise.sets) onPatch({ sets: value })
          } else event.target.value = String(exercise.sets)
        }}
      />

      <input
        aria-label="Reps"
        defaultValue={exercise.reps}
        className={NUM_FIELD}
        onBlur={(event) => {
          const value = event.target.value.trim()
          if (value && value !== exercise.reps) onPatch({ reps: value })
          else event.target.value = exercise.reps
        }}
      />

      <div className="text-graphite-soft flex items-center justify-end gap-0.5">
        <button
          type="button"
          aria-label="Subir exercício"
          disabled={!canMoveUp}
          onClick={() => onMove(-1)}
          className="hover:text-graphite p-1 transition-transform active:scale-90 disabled:opacity-25"
        >
          ↑
        </button>
        <button
          type="button"
          aria-label="Descer exercício"
          disabled={!canMoveDown}
          onClick={() => onMove(1)}
          className="hover:text-graphite p-1 transition-transform active:scale-90 disabled:opacity-25"
        >
          ↓
        </button>
        <button
          type="button"
          aria-label="Remover exercício"
          onClick={leave}
          className="hover:text-rust p-1 transition-colors active:scale-90"
        >
          ×
        </button>
      </div>
    </div>
  )
}
