import { describe, expect, it } from 'vitest'
import { db } from './db'
import { importLegacyLocalStorage } from './importLegacy'

const NOW = new Date('2026-10-16T12:00:00.000Z')

function seedLegacy(): void {
  localStorage.setItem('cg:config', JSON.stringify({ targetCalories: 3300 }))
  localStorage.setItem('cg:weightLog', JSON.stringify([{ date: '2026-08-10', kg: 80 }]))
  localStorage.setItem(
    'cg:trainingLog',
    JSON.stringify([{ date: '2026-08-10', dayName: 'Push A', exercises: [] }]),
  )
  localStorage.setItem(
    'cg:supplementLog',
    JSON.stringify([{ date: '2026-08-10', taken: ['Creatina'] }]),
  )
}

describe('importLegacyLocalStorage', () => {
  it('copia as 4 chaves pro banco e marca a importação', async () => {
    seedLegacy()

    expect(await importLegacyLocalStorage(NOW)).toBe(true)

    expect(await db.table('config').get('main')).toEqual({
      id: 'main',
      config: { targetCalories: 3300 },
    })
    expect(await db.table('weightLog').toArray()).toEqual([{ date: '2026-08-10', kg: 80 }])
    expect(await db.table('trainingLog').toArray()).toEqual([
      { date: '2026-08-10', dayName: 'Push A', exercises: [] },
    ])
    expect(await db.table('supplementLog').toArray()).toEqual([
      { date: '2026-08-10', taken: ['Creatina'] },
    ])
    expect(await db.table('meta').get('importedFromLocalStorage')).toEqual({
      key: 'importedFromLocalStorage',
      value: '2026-10-16T12:00:00.000Z',
    })
  })

  it('não reimporta nem sobrescreve o banco na 2ª vez', async () => {
    seedLegacy()
    await importLegacyLocalStorage(NOW)
    await db.table('weightLog').put({ date: '2026-08-10', kg: 81 })

    expect(await importLegacyLocalStorage(NOW)).toBe(false)
    expect(await db.table('weightLog').get('2026-08-10')).toEqual({ date: '2026-08-10', kg: 81 })
  })

  it('mantém as chaves cg:* no localStorage', async () => {
    seedLegacy()
    await importLegacyLocalStorage(NOW)
    expect(localStorage.getItem('cg:weightLog')).not.toBeNull()
    expect(localStorage.getItem('cg:config')).not.toBeNull()
  })

  it('sem legado: marca a importação e deixa o banco vazio', async () => {
    expect(await importLegacyLocalStorage(NOW)).toBe(true)
    expect(await db.table('config').count()).toBe(0)
    expect(await db.table('weightLog').count()).toBe(0)
  })

  it('ignora legado malformado e importa o que é válido', async () => {
    localStorage.setItem('cg:weightLog', JSON.stringify({ not: 'an array' }))
    localStorage.setItem(
      'cg:supplementLog',
      JSON.stringify([{ taken: ['sem data'] }, null, { date: '2026-08-11', taken: ['Creatina'] }]),
    )
    localStorage.setItem('cg:trainingLog', '{quebrado')

    expect(await importLegacyLocalStorage(NOW)).toBe(true)
    expect(await db.table('weightLog').count()).toBe(0)
    expect(await db.table('trainingLog').count()).toBe(0)
    expect(await db.table('supplementLog').toArray()).toEqual([
      { date: '2026-08-11', taken: ['Creatina'] },
    ])
  })

  it('converte nomes de exercício em ids sem tocar no localStorage', async () => {
    localStorage.setItem(
      'cg:config',
      JSON.stringify({
        targetCalories: 3300,
        trainingSplit: [
          {
            weekday: 1,
            name: 'Push',
            focus: 'x',
            exercises: [{ name: 'Rosca martelo', sets: 3, reps: '8-15' }],
          },
        ],
      }),
    )
    localStorage.setItem(
      'cg:trainingLog',
      JSON.stringify([
        {
          date: '2026-08-10',
          dayName: 'Push',
          exercises: [{ name: 'Leg press', sets: [{ weight: 100, reps: 8 }] }],
        },
      ]),
    )

    await importLegacyLocalStorage(NOW)

    expect(await db.table('config').get('main')).toEqual({
      id: 'main',
      config: {
        targetCalories: 3300,
        trainingSplit: [
          {
            weekday: 1,
            name: 'Push',
            focus: 'x',
            exercises: [{ exerciseId: 'Hammer_Curls', sets: 3, reps: '8-15' }],
          },
        ],
      },
    })
    expect(await db.table('trainingLog').toArray()).toEqual([
      {
        date: '2026-08-10',
        dayName: 'Push',
        exercises: [{ exerciseId: 'Leg_Press', sets: [{ weight: 100, reps: 8 }] }],
      },
    ])
    expect(localStorage.getItem('cg:trainingLog')).toContain('Leg press')
  })
})
