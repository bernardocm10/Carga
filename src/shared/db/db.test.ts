import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { CONFIG_ROW_ID, DB_VERSION, db, defineSchema } from './db'

describe('db', () => {
  it('tem as tabelas do schema v2', () => {
    expect(db.tables.map((table) => table.name).sort()).toEqual([
      'config',
      'imageChoice',
      'meta',
      'supplementLog',
      'trainingLog',
      'weightLog',
    ])
    expect(DB_VERSION).toBe(2)
  })

  it('usa date como chave dos logs e id fixo pra config', async () => {
    await db.table('weightLog').put({ date: '2026-08-10', kg: 80 })
    await db.table('config').put({ id: CONFIG_ROW_ID, config: { targetCalories: 3150 } })
    expect(await db.table('weightLog').get('2026-08-10')).toEqual({ date: '2026-08-10', kg: 80 })
    expect(await db.table('config').get('main')).toEqual({
      id: 'main',
      config: { targetCalories: 3150 },
    })
  })

  it('imageChoice usa exerciseId como chave', async () => {
    await db.table('imageChoice').put({ exerciseId: 'cg:reverse-fly', variantIndex: 1 })
    expect(await db.table('imageChoice').get('cg:reverse-fly')).toEqual({
      exerciseId: 'cg:reverse-fly',
      variantIndex: 1,
    })
  })
})

describe('upgrade v1 → v2', () => {
  it('converte ficha e histórico para exerciseId e preserva o resto', async () => {
    const name = 'claudgym-upgrade-test'
    const v1 = new Dexie(name)
    v1.version(1).stores({
      config: 'id',
      weightLog: 'date',
      trainingLog: 'date',
      supplementLog: 'date',
      meta: 'key',
    })
    await v1.table('config').put({
      id: 'main',
      config: {
        targetCalories: 3150,
        trainingSplit: [
          {
            weekday: 5,
            name: 'Posterior + Glúteo',
            focus: 'Pernas',
            exercises: [
              { name: 'Terra romeno', sets: 3, reps: '6-10' },
              { name: 'Exercício que o usuário digitou', sets: 2, reps: '8' },
            ],
          },
        ],
      },
    })
    await v1.table('weightLog').put({ date: '2026-09-08', kg: 64 })
    await v1.table('trainingLog').put({
      date: '2026-09-02',
      dayName: 'Pernas — quadríceps',
      exercises: [{ name: 'Leg press', sets: [{ weight: 120, reps: 8 }] }],
    })
    v1.close()

    const upgraded = defineSchema(new Dexie(name))
    await upgraded.open()
    try {
      expect(await upgraded.table('config').get('main')).toEqual({
        id: 'main',
        config: {
          targetCalories: 3150,
          trainingSplit: [
            {
              weekday: 5,
              name: 'Posterior + Glúteo',
              focus: 'Pernas',
              exercises: [
                { exerciseId: 'Romanian_Deadlift', sets: 3, reps: '6-10' },
                { exerciseId: 'legacy:Exercício que o usuário digitou', sets: 2, reps: '8' },
              ],
            },
          ],
        },
      })
      expect(await upgraded.table('trainingLog').toArray()).toEqual([
        {
          date: '2026-09-02',
          dayName: 'Pernas — quadríceps',
          exercises: [{ exerciseId: 'Leg_Press', sets: [{ weight: 120, reps: 8 }] }],
        },
      ])
      expect(await upgraded.table('weightLog').toArray()).toEqual([{ date: '2026-09-08', kg: 64 }])
      expect(await upgraded.table('imageChoice').count()).toBe(0)
    } finally {
      upgraded.close()
      await Dexie.delete(name)
    }
  })
})
