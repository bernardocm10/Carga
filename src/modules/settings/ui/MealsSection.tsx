import { useState } from 'react'
import { useConfig, useConfigStore } from '@/entities/config'
import { Button } from '@/shared/ui/Button'
import { Section } from '@/shared/ui/Page'
import { addMeal } from '../domain/editConfig'
import { MealEditor } from './MealEditor'

export function MealsSection() {
  const config = useConfig()
  const updateConfig = useConfigStore((state) => state.updateConfig)
  const [open, setOpen] = useState<number | null>(null)

  return (
    <Section label="refeições">
      <div className="border-hairline flex flex-col border-t">
        {config.meals.map((meal, index) => (
          <MealEditor
            key={`${index}:${meal.name}`}
            index={index}
            open={open === index}
            onToggle={() => setOpen((current) => (current === index ? null : index))}
            canMoveUp={index > 0}
            canMoveDown={index < config.meals.length - 1}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        onClick={() => {
          updateConfig(addMeal(config))
          setOpen(config.meals.length)
        }}
        className="mt-3 self-start px-3 text-xs"
      >
        + refeição
      </Button>
    </Section>
  )
}
