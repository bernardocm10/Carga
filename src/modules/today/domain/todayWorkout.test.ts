import { describe, expect, it } from 'vitest'
import { CONFIG_SEED, type Config } from '@/entities/config'
import type { TrainingSession } from '@/entities/training-log'
import { migrateV1toV2 } from '@/shared/db'
import { todayWorkout } from './todayWorkout'

const TUESDAY = new Date(2026, 8, 1) // 2026-09-01
const WEDNESDAY = new Date(2026, 8, 2)

function config(exercises: Array<{ exerciseId: string; sets: number; reps: string }>): Config {
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
  ex: Array<{ exerciseId: string; sets: Array<[number, number]> }>,
): TrainingSession {
  return {
    date,
    dayName,
    exercises: ex.map((e) => ({
      exerciseId: e.exerciseId,
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
    const out = todayWorkout(
      config([{ exerciseId: 'Seated_Cable_Rows', sets: 4, reps: '8' }]),
      [],
      TUESDAY,
    )
    expect(out.isRest).toBe(false)
    expect(out.rows).toEqual([
      { exerciseId: 'Seated_Cable_Rows', target: '4×8', last: null, delta: null },
    ])
  })

  it('last é o topSet da sessão mais recente que tem o exercício', () => {
    const sessions = [
      session('2026-08-18', 'Puxar', [{ exerciseId: 'Seated_Cable_Rows', sets: [[40, 8]] }]),
      session('2026-08-25', 'Puxar', [{ exerciseId: 'Seated_Cable_Rows', sets: [[44, 6]] }]),
    ]
    const out = todayWorkout(
      config([{ exerciseId: 'Seated_Cable_Rows', sets: 4, reps: '8' }]),
      sessions,
      TUESDAY,
    )
    expect(out.rows[0]?.last).toBe(44)
  })

  it('delta é a última carga menos a anterior', () => {
    const sessions = [
      session('2026-08-18', 'Puxar', [{ exerciseId: 'Seated_Cable_Rows', sets: [[40, 8]] }]),
      session('2026-08-25', 'Puxar', [{ exerciseId: 'Seated_Cable_Rows', sets: [[44, 6]] }]),
    ]
    const out = todayWorkout(
      config([{ exerciseId: 'Seated_Cable_Rows', sets: 4, reps: '8' }]),
      sessions,
      TUESDAY,
    )
    expect(out.rows[0]?.delta).toBe(4)
  })

  it('com um único registro, delta fica null', () => {
    const sessions = [
      session('2026-08-18', 'Puxar', [{ exerciseId: 'Seated_Cable_Rows', sets: [[40, 8]] }]),
    ]
    const out = todayWorkout(
      config([{ exerciseId: 'Seated_Cable_Rows', sets: 4, reps: '8' }]),
      sessions,
      TUESDAY,
    )
    expect(out.rows[0]).toEqual({
      exerciseId: 'Seated_Cable_Rows',
      target: '4×8',
      last: 40,
      delta: null,
    })
  })

  it('lastSessionTonnage soma peso x reps da última sessão do mesmo dia', () => {
    const sessions = [
      session('2026-08-11', 'Puxar', [{ exerciseId: 'Seated_Cable_Rows', sets: [[30, 10]] }]),
      session('2026-08-25', 'Puxar', [
        {
          exerciseId: 'Seated_Cable_Rows',
          sets: [
            [40, 10],
            [40, 8],
          ],
        },
      ]),
      session('2026-08-26', 'Empurrar', [{ exerciseId: 'Hammer_Curls', sets: [[60, 5]] }]),
    ]
    const out = todayWorkout(
      config([{ exerciseId: 'Seated_Cable_Rows', sets: 4, reps: '8' }]),
      sessions,
      TUESDAY,
    )
    expect(out.lastSessionTonnage).toBe(720)
  })

  it('usa a carga de um histórico migrado do v1 (nome → id)', () => {
    const migrated = migrateV1toV2({
      config: {
        ...CONFIG_SEED,
        trainingSplit: [
          {
            weekday: 2,
            name: 'Puxar',
            focus: 'x',
            exercises: [{ name: 'Remada baixa ao quadril', sets: 2, reps: '10-15' }],
          },
        ],
      },
      trainingLog: [
        {
          date: '2026-08-18',
          dayName: 'Puxar',
          exercises: [{ name: 'Remada baixa ao quadril', sets: [{ weight: 40, reps: 8 }] }],
        },
      ],
    })

    const out = todayWorkout(
      migrated.config as Config,
      migrated.trainingLog as TrainingSession[],
      TUESDAY,
    )

    expect(out.rows).toEqual([
      { exerciseId: 'Seated_Cable_Rows', target: '2×10-15', last: 40, delta: null },
    ])
  })
})
