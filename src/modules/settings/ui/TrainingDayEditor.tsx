import type { Config, TrainingDay } from '@/entities/config'
import { useConfig, useConfigStore } from '@/entities/config'
import { addExercise, moveExercise, removeExercise, setExercise } from '../domain/editConfig'
import { ExerciseRow } from './ExerciseRow'

type Props = { day: TrainingDay }

export function TrainingDayEditor({ day }: Props) {
  const config = useConfig()
  const updateConfig = useConfigStore((state) => state.updateConfig)
  const apply = (next: Config) => updateConfig(next)

  return (
    <div className="border-hairline bg-chalk flex flex-col gap-2 rounded border p-4">
      <h2 className="font-display text-graphite text-lg tracking-wide uppercase">
        {day.name} <span className="text-graphite-soft text-sm normal-case">· {day.focus}</span>
      </h2>

      {day.exercises.length === 0 && (
        <p className="text-graphite-soft font-body text-xs">Nenhum exercício ainda.</p>
      )}

      {day.exercises.map((exercise, index) => (
        <ExerciseRow
          key={`${index}:${exercise.name}`}
          exercise={exercise}
          canMoveUp={index > 0}
          canMoveDown={index < day.exercises.length - 1}
          onPatch={(patch) => apply(setExercise(config, day.weekday, index, patch))}
          onRemove={() => apply(removeExercise(config, day.weekday, index))}
          onMove={(direction) => apply(moveExercise(config, day.weekday, index, direction))}
        />
      ))}

      <button
        type="button"
        onClick={() =>
          apply(addExercise(config, day.weekday, { name: 'Novo exercício', sets: 3, reps: '8-12' }))
        }
        className="border-hairline text-graphite-soft font-display self-start rounded border border-dashed px-3 py-2 text-xs tracking-wide uppercase"
      >
        + Adicionar exercício
      </button>
    </div>
  )
}
