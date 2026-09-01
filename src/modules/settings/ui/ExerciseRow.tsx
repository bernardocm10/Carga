import type { Exercise } from '@/entities/config'
import { cn } from '@/shared/lib/cn'
import { useLeave } from '@/shared/lib/useLeave'
import { NumberField } from '@/shared/ui/NumberField'
import { TextField } from '@/shared/ui/TextField'

type Props = {
  exercise: Exercise
  canMoveUp: boolean
  canMoveDown: boolean
  onPatch: (patch: Partial<Exercise>) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

export function ExerciseRow({
  exercise,
  canMoveUp,
  canMoveDown,
  onPatch,
  onRemove,
  onMove,
}: Props) {
  const { leaving, leave } = useLeave(onRemove)

  return (
    <div
      className={cn(
        'border-hairline flex items-end gap-2 rounded border p-2',
        leaving ? 'cg-leave' : 'cg-enter',
      )}
    >
      <TextField
        label="Exercício"
        defaultValue={exercise.name}
        className="min-w-0 flex-1 text-base"
        onBlur={(event) => {
          const value = event.target.value.trim()
          if (value && value !== exercise.name) onPatch({ name: value })
          else event.target.value = exercise.name
        }}
      />
      <NumberField
        label="Séries"
        defaultValue={exercise.sets}
        className="w-14 text-base"
        onBlur={(event) => {
          const value = Math.round(Number(event.target.value))
          if (Number.isFinite(value) && value > 0) {
            if (value !== exercise.sets) onPatch({ sets: value })
          } else event.target.value = String(exercise.sets)
        }}
      />
      <TextField
        label="Reps"
        defaultValue={exercise.reps}
        className="w-16 text-base"
        onBlur={(event) => {
          const value = event.target.value.trim()
          if (value && value !== exercise.reps) onPatch({ reps: value })
          else event.target.value = exercise.reps
        }}
      />
      <div className="flex flex-col">
        <button
          type="button"
          aria-label="Subir exercício"
          disabled={!canMoveUp}
          onClick={() => onMove(-1)}
          className="text-graphite-soft hover:text-graphite transition-transform active:scale-90 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          aria-label="Descer exercício"
          disabled={!canMoveDown}
          onClick={() => onMove(1)}
          className="text-graphite-soft hover:text-graphite transition-transform active:scale-90 disabled:opacity-30"
        >
          ↓
        </button>
      </div>
      <button
        type="button"
        aria-label="Remover exercício"
        onClick={leave}
        className="text-graphite-soft hover:text-rust px-1 transition-colors active:scale-90"
      >
        ×
      </button>
    </div>
  )
}
