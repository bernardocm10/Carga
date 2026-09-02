import { useConfig } from '@/entities/config'
import { useTrainingLog } from '@/entities/training-log'
import { cn } from '@/shared/lib/cn'
import { weekStatus, type DayStatus } from '../domain/weekStatus'

function marker(day: DayStatus): string {
  if (day.hasSession) return 'bg-iron border-iron'
  if (day.isTrainingDay) return 'border-graphite-soft'
  return 'bg-hairline border-hairline'
}

export function WeeklyStrip() {
  const config = useConfig()
  const sessions = useTrainingLog()
  const week = weekStatus(sessions, config, new Date())

  return (
    <ul className="flex justify-between">
      {week.map((day) => (
        <li key={day.date} className="flex flex-col items-center gap-1.5">
          <span
            className={cn(
              'font-display text-xs tracking-wide uppercase',
              day.isToday ? 'text-brass' : 'text-graphite-soft',
            )}
          >
            {day.label}
          </span>
          <span
            className={cn(
              'size-3 rounded-full border',
              marker(day),
              day.isToday && 'ring-brass ring-2 ring-offset-1',
            )}
            aria-hidden
          />
        </li>
      ))}
    </ul>
  )
}
