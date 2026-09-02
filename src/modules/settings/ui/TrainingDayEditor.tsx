import type { Config, TrainingDay } from '@/entities/config'
import { useConfig, useConfigStore } from '@/entities/config'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { addExercise, moveExercise, removeExercise, setExercise } from '../domain/editConfig'
import { ExerciseRow } from './ExerciseRow'

type Props = {
  day: TrainingDay
  open: boolean
  onToggle: () => void
}

export function TrainingDayEditor({ day, open, onToggle }: Props) {
  const config = useConfig()
  const updateConfig = useConfigStore((state) => state.updateConfig)
  const apply = (next: Config) => updateConfig(next)

  return (
    <div className="border-hairline bg-chalk overflow-hidden rounded border">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="active:bg-concrete flex w-full items-center gap-2 p-4 text-left transition-colors"
      >
        <span className="flex-1">
          <span className="font-display text-graphite text-lg tracking-wide uppercase">
            {day.name}
          </span>
          <span className="font-body text-graphite-soft ml-2 text-sm">{day.focus}</span>
        </span>
        <span className="font-body text-graphite-soft shrink-0 text-xs tabular-nums">
          {day.exercises.length}
        </span>
        <span
          className={cn('text-graphite-soft shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-1 px-4 pb-4">
          {day.exercises.length === 0 ? (
            <p className="font-body text-graphite-soft text-xs">Nenhum exercício ainda.</p>
          ) : (
            <div className="font-display text-graphite-soft grid grid-cols-[1fr_2.5rem_4rem_4.5rem] items-center gap-2 px-1 text-[0.65rem] tracking-wide uppercase">
              <span>Exercício</span>
              <span className="text-center">Sér</span>
              <span className="text-center">Reps</span>
              <span />
            </div>
          )}

          <div className="divide-hairline divide-y">
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
          </div>

          <Button
            variant="ghost"
            onClick={() =>
              apply(
                addExercise(config, day.weekday, { name: 'Novo exercício', sets: 3, reps: '8-12' }),
              )
            }
            className="mt-2 self-start px-3 text-xs"
          >
            + Adicionar exercício
          </Button>
        </div>
      )}
    </div>
  )
}
