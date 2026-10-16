import { describe, expect, it } from 'vitest'
import { BackupError, exportAll, importAll } from './backup'
import { db } from './db'
import { persist } from './persist'

const NOW = new Date('2026-10-16T12:00:00.000Z')

async function seed(): Promise<void> {
  await db.table('config').put({ id: 'main', config: { targetCalories: 3150 } })
  await db.table('weightLog').bulkPut([
    { date: '2026-08-10', kg: 80 },
    { date: '2026-08-08', kg: 79.5 },
  ])
  await db.table('trainingLog').put({ date: '2026-08-10', dayName: 'Push A', exercises: [] })
  await db.table('supplementLog').put({ date: '2026-08-10', taken: ['Creatina'] })
}

async function snapshot() {
  return {
    config: await db.table('config').toArray(),
    weightLog: await db.table('weightLog').toArray(),
    trainingLog: await db.table('trainingLog').toArray(),
    supplementLog: await db.table('supplementLog').toArray(),
  }
}

describe('exportAll', () => {
  it('serializa cabeçalho, config e logs ordenados', async () => {
    await seed()
    const file = JSON.parse(await exportAll(NOW)) as Record<string, unknown>
    expect(file).toEqual({
      app: 'claudgym',
      schemaVersion: 1,
      exportedAt: '2026-10-16T12:00:00.000Z',
      config: { targetCalories: 3150 },
      weightLog: [
        { date: '2026-08-08', kg: 79.5 },
        { date: '2026-08-10', kg: 80 },
      ],
      trainingLog: [{ date: '2026-08-10', dayName: 'Push A', exercises: [] }],
      supplementLog: [{ date: '2026-08-10', taken: ['Creatina'] }],
    })
  })

  it('export espera escritas pendentes', async () => {
    await seed()
    persist(db.table('weightLog').put({ date: '2026-08-12', kg: 80.4 }))
    const file = JSON.parse(await exportAll(NOW)) as { weightLog: Array<{ date: string }> }
    expect(file.weightLog.map((e) => e.date)).toContain('2026-08-12')
  })
})

describe('importAll', () => {
  it('round-trip: exportar, apagar e importar devolve o mesmo banco', async () => {
    await seed()
    const before = await snapshot()
    const json = await exportAll(NOW)
    await Promise.all(db.tables.map((table) => table.clear()))

    await importAll(json)

    expect(await snapshot()).toEqual(before)
  })

  it('substitui: linhas que não estão no backup somem', async () => {
    await seed()
    const json = await exportAll(NOW)
    await db.table('weightLog').put({ date: '2026-09-01', kg: 82 })

    await importAll(json)

    expect(await db.table('weightLog').get('2026-09-01')).toBeUndefined()
  })

  it('não toca no meta', async () => {
    await seed()
    await db.table('meta').put({ key: 'importedFromLocalStorage', value: 'x' })
    await importAll(await exportAll(NOW))
    expect(await db.table('meta').get('importedFromLocalStorage')).toEqual({
      key: 'importedFromLocalStorage',
      value: 'x',
    })
  })

  it.each([
    ['JSON inválido', '{quebrado', 'O arquivo não é um JSON válido.'],
    ['outro app', JSON.stringify({ app: 'outro' }), 'Esse arquivo não é um backup do claudgym.'],
    [
      'versão futura',
      JSON.stringify({ app: 'claudgym', schemaVersion: 99 }),
      'Backup de uma versão mais nova do app — atualize o app antes de importar.',
    ],
    [
      'sem config',
      JSON.stringify({
        app: 'claudgym',
        schemaVersion: 1,
        weightLog: [],
        trainingLog: [],
        supplementLog: [],
      }),
      'Backup incompleto: falta a config.',
    ],
    [
      'log que não é lista',
      JSON.stringify({
        app: 'claudgym',
        schemaVersion: 1,
        config: {},
        weightLog: {},
        trainingLog: [],
        supplementLog: [],
      }),
      'Backup inválido: weightLog.',
    ],
    [
      'linha sem date',
      JSON.stringify({
        app: 'claudgym',
        schemaVersion: 1,
        config: {},
        weightLog: [{ kg: 80 }],
        trainingLog: [],
        supplementLog: [],
      }),
      'Backup inválido: weightLog.',
    ],
  ])('rejeita sem tocar nos dados: %s', async (_case, json, message) => {
    await seed()
    const before = await snapshot()

    await expect(importAll(json)).rejects.toThrow(new BackupError(message))

    expect(await snapshot()).toEqual(before)
  })
})
