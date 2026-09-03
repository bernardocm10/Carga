import { useConfig } from '@/entities/config'
import { useTrainingLog } from '@/entities/training-log'
import { cn } from '@/shared/lib/cn'
import { LoadBar, type PlateColor } from '@/shared/ui/LoadBar'
import { Section } from '@/shared/ui/Page'
import { todayWorkout, type WorkoutRow } from '../domain/todayWorkout'

function fmtKg(value: number): string {
  return String(value).replace('.', ',')
}

/** cor da anilha pela faixa de peso, imitando os saltos reais de disco */
function plateColor(kg: number): PlateColor {
  if (kg >= 45) return 'rust'
  if (kg >= 25) return 'iron'
  if (kg >= 15) return 'brass'
  return 'tatami'
}

function Hero({ row }: { row: WorkoutRow }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-display text-graphite text-[28px] leading-none font-black uppercase">
        {row.name}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-graphite text-5xl leading-[0.8] font-black">
          {row.last === null ? '—' : fmtKg(row.last)}
        </span>
        <span className="text-graphite-soft font-display text-lg font-bold">kg</span>
        {row.delta !== null && row.delta !== 0 && (
          <span
            className={cn(
              'ml-auto self-center px-2 py-0.5 text-[13px] font-semibold text-white',
              row.delta > 0 ? 'bg-tatami' : 'bg-rust',
            )}
          >
            {row.delta > 0 ? `▲ +${fmtKg(row.delta)}` : `▼ ${fmtKg(row.delta)}`}
          </span>
        )}
      </div>
      <LoadBar
        value={row.last === null ? 0 : row.last / 100}
        color={row.last === null ? 'steel' : plateColor(row.last)}
        size="lg"
      />
      <p className="text-graphite-soft text-xs font-medium">alvo {row.target}</p>
    </div>
  )
}

function RestRow({ row, dayMax }: { row: WorkoutRow; dayMax: number }) {
  if (row.last === null) {
    return (
      <li className="flex items-baseline justify-between gap-3">
        <span className="text-graphite min-w-0 truncate text-sm font-medium">{row.name}</span>
        <span className="text-graphite-soft shrink-0 text-xs font-medium">{row.target}</span>
      </li>
    )
  }
  return (
    <li className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-1">
      <span className="text-graphite min-w-0 truncate text-sm font-medium">{row.name}</span>
      <span className="font-display text-graphite text-base font-bold">{fmtKg(row.last)}</span>
      <LoadBar className="col-span-2" value={row.last / dayMax} color={plateColor(row.last)} />
    </li>
  )
}

export function WorkoutList() {
  const config = useConfig()
  const sessions = useTrainingLog()
  const workout = todayWorkout(config, sessions, new Date())

  if (workout.isRest) {
    return (
      <Section label="treino de hoje">
        <p className="text-graphite-soft text-sm">Dia de descanso.</p>
      </Section>
    )
  }

  const hasHistory = workout.rows.some((row) => row.last !== null)

  if (!hasHistory) {
    return (
      <Section label="treino de hoje">
        <ul className="flex flex-col gap-2">
          {workout.rows.map((row) => (
            <li key={row.name} className="flex items-baseline justify-between gap-3">
              <span className="text-graphite min-w-0 truncate text-sm font-medium">{row.name}</span>
              <span className="text-graphite-soft shrink-0 text-xs font-medium">{row.target}</span>
            </li>
          ))}
        </ul>
      </Section>
    )
  }

  const [first, ...rest] = workout.rows
  if (first === undefined) return null
  const dayMax = Math.max(...workout.rows.map((row) => row.last ?? 0), 1)

  return (
    <div className="flex flex-col gap-7">
      <Hero row={first} />
      {rest.length > 0 && (
        <Section label="resto do treino">
          <ul className="flex flex-col gap-3">
            {rest.map((row) => (
              <RestRow key={row.name} row={row} dayMax={dayMax} />
            ))}
          </ul>
        </Section>
      )}
      {workout.lastSessionTonnage !== null && (
        <p className="text-graphite-soft text-xs font-medium">
          última sessão ·{' '}
          <span className="text-graphite font-display text-sm font-bold">
            {workout.lastSessionTonnage.toLocaleString('pt-BR')} kg
          </span>
        </p>
      )}
    </div>
  )
}
