import { describe, expect, it } from 'vitest'
import { CONFIG_SEED, type Config } from '@/entities/config'
import type { TrainingSession } from '@/entities/training-log'
import { todayWorkout } from './todayWorkout'

const TUESDAY = new Date(2026, 8, 1) // 2026-09-01
const WEDNESDAY = new Date(2026, 8, 2)

function config(exercises: Array<{ name: string; sets: number; reps: string }>): Config {
  return {
    ...CONFIG_SEED,
    trainingSplit: [
      { weekday: 2, name: 'Puxar', focus: 'Costas', exercises },
      { weekday: 3, name: 'Descanso', focus: '—', exercises: [] },
    ],
  }
}

function session(
  date: string,
  dayName: string,
  ex: Array<{ name: string; sets: Array<[number, number]> }>,
): TrainingSession {
  return {
    date,
    dayName,
    exercises: ex.map((e) => ({
      name: e.name,
      sets: e.sets.map(([weight, reps]) => ({ weight, reps })),
    })),
  }
}

describe('todayWorkout', () => {
  it('dia sem exercícios -> descanso', () => {
    const out = todayWorkout(config([]), [], WEDNESDAY)
    expect(out).toEqual({
      isRest: true,
      dayName: 'Descanso',
      rows: [],
      lastSessionTonnage: null,
    })
  })

  it('monta as linhas com alvo; sem histórico last e delta ficam null', () => {
    const out = todayWorkout(config([{ name: 'Remada', sets: 4, reps: '8' }]), [], TUESDAY)
    expect(out.isRest).toBe(false)
    expect(out.rows).toEqual([{ name: 'Remada', target: '4×8', last: null, delta: null }])
  })

  it('last é o topSet da sessão mais recente que tem o exercício', () => {
    const sessions = [
      session('2026-08-18', 'Puxar', [{ name: 'Remada', sets: [[40, 8]] }]),
      session('2026-08-25', 'Puxar', [{ name: 'Remada', sets: [[44, 6]] }]),
    ]
    const out = todayWorkout(config([{ name: 'Remada', sets: 4, reps: '8' }]), sessions, TUESDAY)
    expect(out.rows[0]?.last).toBe(44)
  })

  it('delta é a última carga menos a anterior', () => {
    const sessions = [
      session('2026-08-18', 'Puxar', [{ name: 'Remada', sets: [[40, 8]] }]),
      session('2026-08-25', 'Puxar', [{ name: 'Remada', sets: [[44, 6]] }]),
    ]
    const out = todayWorkout(config([{ name: 'Remada', sets: 4, reps: '8' }]), sessions, TUESDAY)
    expect(out.rows[0]?.delta).toBe(4)
  })

  it('com um único registro, delta fica null', () => {
    const sessions = [session('2026-08-18', 'Puxar', [{ name: 'Remada', sets: [[40, 8]] }])]
    const out = todayWorkout(config([{ name: 'Remada', sets: 4, reps: '8' }]), sessions, TUESDAY)
    expect(out.rows[0]).toEqual({ name: 'Remada', target: '4×8', last: 40, delta: null })
  })

  it('lastSessionTonnage soma peso x reps da última sessão do mesmo dia', () => {
    const sessions = [
      session('2026-08-11', 'Puxar', [{ name: 'Remada', sets: [[30, 10]] }]),
      session('2026-08-25', 'Puxar', [
        {
          name: 'Remada',
          sets: [
            [40, 10],
            [40, 8],
          ],
        },
      ]),
      session('2026-08-26', 'Empurrar', [{ name: 'Supino', sets: [[60, 5]] }]),
    ]
    const out = todayWorkout(config([{ name: 'Remada', sets: 4, reps: '8' }]), sessions, TUESDAY)
    expect(out.lastSessionTonnage).toBe(720)
  })
})
