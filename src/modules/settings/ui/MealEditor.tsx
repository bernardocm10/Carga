import type { Config, Macros } from '@/entities/config'
import { useConfig, useConfigStore } from '@/entities/config'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { LoadBar } from '@/shared/ui/LoadBar'
import {
  addMealItem,
  moveMeal,
  removeMeal,
  removeMealItem,
  setMeal,
  setMealItem,
  setMealMacro,
} from '../domain/editConfig'
import { InlineText } from './InlineText'
import { NumberEditor } from './NumberEditor'

type Props = {
  index: number
  open: boolean
  onToggle: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

const MACROS: Array<[keyof Macros, string]> = [
  ['protein', 'P (g)'],
  ['carbs', 'C (g)'],
  ['fat', 'G (g)'],
]

export function MealEditor({ index, open, onToggle, canMoveUp, canMoveDown }: Props) {
  const config = useConfig()
  const updateConfig = useConfigStore((state) => state.updateConfig)
  const apply = (next: Config) => updateConfig(next)
  const meal = config.meals[index]
  if (meal === undefined) return null

  const { protein, carbs, fat } = meal.macros
  const total = protein * 4 + carbs * 4 + fat * 9 || 1

  return (
    <div className="border-hairline border-b">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-baseline gap-2 py-2.5 text-left"
      >
        <span className="text-graphite flex-1 text-sm font-semibold">{meal.name}</span>
        <span className="font-display text-graphite text-base font-bold">{meal.kcal}</span>
        <span className="text-graphite-soft text-[11px]">kcal</span>
        <span
          className={cn('text-graphite-soft shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 pt-1 pb-4">
          <InlineText
            ariaLabel="Nome da refeição"
            value={meal.name}
            onCommit={(value) => value && apply(setMeal(config, index, { name: value }))}
          />
          <InlineText
            ariaLabel="Quando encaixar"
            value={meal.when}
            placeholder="quando encaixar na rotina"
            onCommit={(value) => apply(setMeal(config, index, { when: value }))}
          />

          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2">
            <NumberEditor
              label="kcal"
              initial={meal.kcal}
              min={0}
              onCommit={(value) => apply(setMeal(config, index, { kcal: value }))}
            />
            {MACROS.map(([key, label]) => (
              <NumberEditor
                key={key}
                label={label}
                initial={meal.macros[key]}
                min={0}
                onCommit={(value) => apply(setMealMacro(config, index, key, value))}
              />
            ))}
          </div>

          <LoadBar
            segments={[
              { color: 'tatami', pct: ((protein * 4) / total) * 100 },
              { color: 'iron', pct: ((carbs * 4) / total) * 100 },
              { color: 'brass', pct: ((fat * 9) / total) * 100 },
            ]}
          />

          <div className="flex flex-col gap-1.5">
            {meal.items.map((item, itemIndex) => (
              <div key={`${itemIndex}:${item}`} className="flex items-center gap-2">
                <InlineText
                  ariaLabel={`Item ${itemIndex + 1}`}
                  value={item}
                  onCommit={(value) => apply(setMealItem(config, index, itemIndex, value))}
                />
                <button
                  type="button"
                  aria-label="Remover item"
                  onClick={() => apply(removeMealItem(config, index, itemIndex))}
                  className="text-graphite-soft hover:text-rust shrink-0 p-1"
                >
                  ×
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              onClick={() => apply(addMealItem(config, index, 'novo item'))}
              className="self-start px-3 text-xs"
            >
              + item
            </Button>
          </div>

          <div className="text-graphite-soft flex items-center gap-1">
            <button
              type="button"
              aria-label="Subir refeição"
              disabled={!canMoveUp}
              onClick={() => apply(moveMeal(config, index, -1))}
              className="hover:text-graphite p-1 disabled:opacity-25"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Descer refeição"
              disabled={!canMoveDown}
              onClick={() => apply(moveMeal(config, index, 1))}
              className="hover:text-graphite p-1 disabled:opacity-25"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => apply(removeMeal(config, index))}
              className="hover:text-rust ml-auto p-1 text-xs font-semibold"
            >
              remover refeição
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
