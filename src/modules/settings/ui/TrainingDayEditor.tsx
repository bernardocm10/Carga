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
    <div className="border-hairline border-b">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-baseline gap-2 py-2.5 text-left"
      >
        <span className="text-graphite flex-1 text-sm font-semibold">{day.name}</span>
        <span className="text-graphite-soft text-[11px]">{day.focus}</span>
        <span className="font-display text-graphite text-base font-bold tabular-nums">
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
        <div className="flex flex-col gap-1 pt-1 pb-4">
          {day.exercises.length === 0 ? (
            <p className="text-graphite-soft text-xs">Nenhum exercício ainda.</p>
          ) : (
            <div className="text-graphite-soft grid grid-cols-[1fr_2.5rem_4rem_4.5rem] items-center gap-2 px-1 text-[0.65rem] font-semibold tracking-wide uppercase">
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
