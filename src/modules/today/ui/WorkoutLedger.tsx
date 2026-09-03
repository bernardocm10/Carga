import { useConfig } from '@/entities/config'
import { useTrainingLog } from '@/entities/training-log'
import { cn } from '@/shared/lib/cn'
import { LedgerSection } from '@/shared/ui/Ledger'
import { todayWorkout, type WorkoutRow } from '../domain/todayWorkout'

const ROW = 'grid grid-cols-[minmax(0,1fr)_3.5rem_3rem] items-center gap-3'

function fmtKg(value: number): string {
  return String(value).replace('.', ',')
}

function Delta({ value }: { value: number | null }) {
  if (value === null || value === 0) {
    return <span className="text-graphite-soft text-right font-mono text-[10px]">—</span>
  }
  return (
    <span
      className={cn('text-right font-mono text-[10px]', value > 0 ? 'text-tatami' : 'text-brass')}
    >
      {value > 0 ? `+${fmtKg(value)}` : fmtKg(value)}
    </span>
  )
}

function Row({ row }: { row: WorkoutRow }) {
  return (
    <div className={cn(ROW, 'odd:bg-tatami/[0.07] py-1.5')}>
      <span className="min-w-0">
        <span className="text-graphite block truncate text-sm">{row.name}</span>
        <span className="text-graphite-soft block font-mono text-[10px]">{row.target}</span>
      </span>
      <span className="text-graphite text-right font-mono text-[11px]">
        {row.last === null ? '—' : fmtKg(row.last)}
      </span>
      <Delta value={row.delta} />
    </div>
  )
}

export function WorkoutLedger() {
  const config = useConfig()
  const sessions = useTrainingLog()
  const workout = todayWorkout(config, sessions, new Date())

  if (workout.isRest) {
    return (
      <LedgerSection label="Treino de hoje">
        <p className="text-graphite-soft text-sm">Dia de descanso.</p>
      </LedgerSection>
    )
  }

  const hasHistory = workout.rows.some((row) => row.last !== null)

  if (!hasHistory) {
    return (
      <LedgerSection label="Treino de hoje">
        <ul className="flex flex-col">
          {workout.rows.map((row) => (
            <li
              key={row.name}
              className="odd:bg-tatami/[0.07] flex items-baseline justify-between gap-3 py-1.5"
            >
              <span className="text-graphite min-w-0 truncate text-sm">{row.name}</span>
              <span className="text-graphite-soft shrink-0 font-mono text-[11px]">
                {row.target}
              </span>
            </li>
          ))}
        </ul>
      </LedgerSection>
    )
  }

  return (
    <LedgerSection label="Treino de hoje">
      <div className="flex flex-col">
        <div
          className={cn(
            ROW,
            'text-graphite-soft border-hairline border-b pb-1.5 font-mono text-[9px] tracking-wider uppercase',
          )}
        >
          <span className="min-w-0 truncate">exercício</span>
          <span className="text-right">última</span>
          <span className="text-right">Δ</span>
        </div>
        {workout.rows.map((row) => (
          <Row key={row.name} row={row} />
        ))}
        {workout.lastSessionTonnage !== null && (
          <div className="border-graphite-soft text-graphite-soft mt-1 flex items-center justify-between border-t-[3px] border-double pt-2 font-mono text-[10px] tracking-wider uppercase">
            <span>última sessão</span>
            <span className="text-graphite text-sm tracking-normal normal-case">
              {workout.lastSessionTonnage.toLocaleString('pt-BR')} kg
            </span>
          </div>
        )}
      </div>
    </LedgerSection>
  )
}
