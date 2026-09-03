import { useConfig } from '@/entities/config'
import { useTrainingLog } from '@/entities/training-log'
import { cn } from '@/shared/lib/cn'
import { Section } from '@/shared/ui/Page'
import { weekStatus, type DayStatus } from '../domain/weekStatus'

function mark(day: DayStatus): string {
  if (day.hasSession) return 'bg-tatami'
  if (day.isToday) return 'bg-brass'
  if (day.isTrainingDay) return 'bg-steel'
  return 'bg-hairline'
}

export function WeeklyStrip() {
  const week = weekStatus(useTrainingLog(), useConfig(), new Date())

  return (
    <Section label="semana">
      <ul className="grid grid-cols-7 gap-1.5">
        {week.map((day) => (
          <li key={day.date} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                'text-[10px] font-semibold',
                day.isToday ? 'text-brass' : 'text-graphite-soft',
              )}
            >
              {day.label}
            </span>
            <span className={cn('h-1.5 w-full', mark(day))} aria-hidden />
          </li>
        ))}
      </ul>
    </Section>
  )
}
