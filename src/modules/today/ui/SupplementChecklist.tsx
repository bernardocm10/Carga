import { useConfig } from '@/entities/config'
import { useSupplementLogStore, useTakenOn } from '@/entities/supplement-log'
import { cn } from '@/shared/lib/cn'
import { toISODate } from '@/shared/date/week'

export function SupplementChecklist() {
  const config = useConfig()
  const today = toISODate(new Date())
  const taken = useTakenOn(today)
  const toggle = useSupplementLogStore((state) => state.toggle)

  return (
    <section className="border-iron bg-chalk flex flex-col gap-2 rounded border border-l-2 p-4">
      <h2 className="font-display text-graphite-soft text-sm tracking-wide uppercase">
        Suplementos de hoje
      </h2>

      <ul className="flex flex-col gap-1">
        {config.supplements.map((supplement) => {
          const done = taken.includes(supplement.name)
          return (
            <li key={supplement.name}>
              <button
                type="button"
                aria-pressed={done}
                onClick={() => toggle(today, supplement.name)}
                className="font-body text-graphite flex w-full items-center gap-2 py-1 text-left text-sm active:scale-[0.99]"
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
                    done ? 'border-iron bg-iron text-chalk' : 'border-graphite-soft',
                  )}
                  aria-hidden
                >
                  {done ? '✓' : ''}
                </span>
                <span className={cn(done && 'text-graphite-soft line-through')}>
                  {supplement.name}
                </span>
                <span className="text-graphite-soft ml-auto font-mono text-xs">
                  {supplement.timing}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
