import { useConfig } from '@/entities/config'
import { useTrainingLog } from '@/entities/training-log'
import { cn } from '@/shared/lib/cn'
import { LedgerSection } from '@/shared/ui/Ledger'
import { weekStatus, type DayStatus } from '../domain/weekStatus'

function glyph(day: DayStatus): { mark: string; color: string } {
  if (day.hasSession) return { mark: '✓', color: 'text-tatami' }
  if (day.isToday) return { mark: '●', color: 'text-brass' }
  if (day.isTrainingDay) return { mark: '·', color: 'text-graphite-soft' }
  return { mark: '–', color: 'text-graphite-soft/50' }
}

export function WeeklyStrip() {
  const config = useConfig()
  const sessions = useTrainingLog()
  const week = weekStatus(sessions, config, new Date())

  return (
    <LedgerSection label="Semana">
      <ul className="grid grid-cols-7 text-center font-mono">
        {week.map((day) => {
          const { mark, color } = glyph(day)
          return (
            <li key={day.date} className="flex flex-col items-center gap-1 py-0.5">
              <span
                className={cn(
                  'text-[9px] tracking-widest uppercase',
                  day.isToday ? 'text-brass' : 'text-graphite-soft',
                )}
              >
                {day.label}
              </span>
              <span className={cn('text-xs leading-none', color)} aria-hidden>
                {mark}
              </span>
            </li>
          )
        })}
      </ul>
    </LedgerSection>
  )
}
