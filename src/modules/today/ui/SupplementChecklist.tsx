import { useConfig } from '@/entities/config'
import { useSupplementLogStore, useTakenOn } from '@/entities/supplement-log'
import { cn } from '@/shared/lib/cn'
import { toISODate } from '@/shared/date/week'
import { LedgerSection } from '@/shared/ui/Ledger'

export function SupplementChecklist() {
  const config = useConfig()
  const today = toISODate(new Date())
  const taken = useTakenOn(today)
  const toggle = useSupplementLogStore((state) => state.toggle)

  return (
    <LedgerSection label="Suplementos">
      <ul className="flex flex-col">
        {config.supplements.map((supplement) => {
          const done = taken.includes(supplement.name)
          return (
            <li key={supplement.name} className="odd:bg-tatami/[0.07]">
              <button
                type="button"
                aria-pressed={done}
                onClick={() => toggle(today, supplement.name)}
                className="text-graphite flex w-full items-center gap-2.5 py-1.5 text-left text-sm active:scale-[0.99]"
              >
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center border text-[10px] transition-colors',
                    done ? 'border-iron bg-iron text-concrete' : 'border-graphite-soft',
                  )}
                  aria-hidden
                >
                  {done ? '✓' : ''}
                </span>
                <span className={cn('min-w-0 truncate', done && 'text-graphite-soft line-through')}>
                  {supplement.name}
                </span>
                <span className="text-graphite-soft ml-auto shrink-0 pl-3 text-right font-mono text-[10px]">
                  {supplement.timing}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </LedgerSection>
  )
}
