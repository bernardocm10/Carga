import { describe, expect, it } from 'vitest'
import type { TrainingSession } from '@/entities/training-log'
import { lastLoadForExercise } from './training-log.selectors'

function session(date: string, sets: Array<[number, number]>): TrainingSession {
  return {
    date,
    dayName: 'Push A',
    exercises: [{ name: 'Supino reto', sets: sets.map(([weight, reps]) => ({ weight, reps })) }],
  }
}

describe('lastLoadForExercise', () => {
  it('sem histórico -> undefined', () => {
    expect(lastLoadForExercise([], 'Supino reto')).toBeUndefined()
  })

  it('devolve as séries da sessão que contém o exercício', () => {
    const out = lastLoadForExercise([session('2026-08-10', [[40, 6]])], 'Supino reto')
    expect(out).toEqual({
      date: '2026-08-10',
      sets: [{ weight: 40, reps: 6 }],
      topSet: { weight: 40, reps: 6 },
    })
  })

  it('pega a sessão mais recente entre várias', () => {
    const out = lastLoadForExercise(
      [session('2026-08-01', [[35, 8]]), session('2026-08-12', [[42, 5]])],
      'Supino reto',
    )
    expect(out?.date).toBe('2026-08-12')
  })

  it('before exclui sessões nessa data ou depois', () => {
    const out = lastLoadForExercise(
      [session('2026-08-01', [[35, 8]]), session('2026-08-12', [[42, 5]])],
      'Supino reto',
      '2026-08-12',
    )
    expect(out?.date).toBe('2026-08-01')
  })

  it('exercício ausente em todas -> undefined', () => {
    expect(lastLoadForExercise([session('2026-08-10', [[40, 6]])], 'Agachamento')).toBeUndefined()
  })

  it('exercício presente mas sem séries -> undefined', () => {
    const empty: TrainingSession = {
      date: '2026-08-10',
      dayName: 'Push A',
      exercises: [{ name: 'Supino reto', sets: [] }],
    }
    expect(lastLoadForExercise([empty], 'Supino reto')).toBeUndefined()
  })

  it('topSet é a série mais pesada, desempatando por reps', () => {
    const out = lastLoadForExercise(
      [
        session('2026-08-10', [
          [40, 10],
          [45, 4],
          [45, 6],
        ]),
      ],
      'Supino reto',
    )
    expect(out?.topSet).toEqual({ weight: 45, reps: 6 })
  })
})
