import { useConfig } from '@/entities/config'
import { useSupplementLogStore, useTakenOn } from '@/entities/supplement-log'
import { cn } from '@/shared/lib/cn'
import { toISODate } from '@/shared/date/week'
import { Section } from '@/shared/ui/Page'

export function SupplementChecklist() {
  const config = useConfig()
  const today = toISODate(new Date())
  const taken = useTakenOn(today)
  const toggle = useSupplementLogStore((state) => state.toggle)

  return (
    <Section label="suplementos">
      <ul className="flex flex-col gap-1">
        {config.supplements.map((supplement) => {
          const done = taken.includes(supplement.name)
          return (
            <li key={supplement.name}>
              <button
                type="button"
                aria-pressed={done}
                onClick={() => toggle(today, supplement.name)}
                className="text-graphite flex w-full items-center gap-3 py-1.5 text-left text-sm active:scale-[0.99]"
              >
                <span
                  className={cn(
                    'block size-3.5 shrink-0 rounded-full border-2 transition-colors',
                    done ? 'border-iron bg-iron' : 'border-steel',
                  )}
                  aria-hidden
                />
                <span className={cn('font-medium', done && 'text-graphite-soft line-through')}>
                  {supplement.name}
                </span>
                <span className="text-graphite-soft ml-auto shrink-0 pl-3 text-right text-[11px]">
                  {supplement.timing}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
