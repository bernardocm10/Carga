import { describe, expect, it } from 'vitest'
import { CONFIG_SEED } from '@/entities/config'
import type { TrainingSession } from '@/entities/training-log'
import { weekStatus } from './weekStatus'

// Quinta, 2026-09-03 — semana ISO 2026-08-31 (Seg) … 2026-09-06 (Dom)
const THURSDAY = new Date(2026, 8, 3)

function sessionOn(date: string): TrainingSession {
  return { date, dayName: 'Treino', exercises: [{ name: 'X', sets: [{ weight: 1, reps: 1 }] }] }
}

describe('weekStatus', () => {
  it('devolve 7 dias de segunda a domingo', () => {
    const week = weekStatus([], CONFIG_SEED, THURSDAY)
    expect(week.map((d) => d.label)).toEqual(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'])
    expect(week.map((d) => d.date)).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ])
    expect(week.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0])
  })

  it('marca o dia de hoje', () => {
    const week = weekStatus([], CONFIG_SEED, THURSDAY)
    expect(week.filter((d) => d.isToday).map((d) => d.date)).toEqual(['2026-09-03'])
  })

  it('marca os dias com sessão registrada na semana', () => {
    const week = weekStatus(
      [sessionOn('2026-09-01'), sessionOn('2026-08-10')],
      CONFIG_SEED,
      THURSDAY,
    )
    expect(week.filter((d) => d.hasSession).map((d) => d.date)).toEqual(['2026-09-01'])
  })

  it('classifica dia de treino vs descanso pelo split da config', () => {
    const week = weekStatus([], CONFIG_SEED, THURSDAY)
    expect(week.map((d) => d.isTrainingDay)).toEqual([true, true, true, true, true, false, false])
  })
})
