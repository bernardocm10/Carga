import type { TrainingDay } from '@/entities/config'
import { cn } from '@/shared/lib/cn'

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function mondayFirst(weekday: number): number {
  return (weekday + 6) % 7
}

type Props = {
  split: TrainingDay[]
  selectedWeekday: number
  onSelectWeekday: (weekday: number) => void
  date: string
  onDateChange: (date: string) => void
  today: string
}

export function DaySelector({
  split,
  selectedWeekday,
  onSelectWeekday,
  date,
  onDateChange,
  today,
}: Props) {
  const days = [...split].sort((a, b) => mondayFirst(a.weekday) - mondayFirst(b.weekday))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {days.map((day) => {
          const isActive = day.weekday === selectedWeekday
          return (
            <button
              key={day.weekday}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectWeekday(day.weekday)}
              className={cn(
                'font-display flex-1 rounded border py-2 text-xs tracking-wide uppercase',
                'transition-colors duration-150 active:scale-[0.97]',
                isActive
                  ? 'border-iron bg-iron text-chalk'
                  : 'border-hairline bg-chalk text-graphite-soft hover:text-graphite',
              )}
            >
              {WEEKDAY_SHORT[day.weekday]}
            </button>
          )
        })}
      </div>
      <label htmlFor="training-date" className="flex flex-col gap-1">
        <span className="font-display text-graphite-soft text-xs tracking-wide uppercase">
          Data
        </span>
        <input
          id="training-date"
          type="date"
          value={date}
          max={today}
          onChange={(event) => onDateChange(event.target.value)}
          className="border-hairline bg-chalk text-graphite focus:border-iron rounded border px-3 py-2 font-mono focus:outline-none"
        />
      </label>
    </div>
  )
}
