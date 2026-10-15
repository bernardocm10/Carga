import { describe, expect, it } from 'vitest'
import { CONFIG_ROW_ID, DB_VERSION, db } from './db'

describe('db', () => {
  it('tem as tabelas do schema v1', () => {
    expect(db.tables.map((table) => table.name).sort()).toEqual([
      'config',
      'meta',
      'supplementLog',
      'trainingLog',
      'weightLog',
    ])
    expect(DB_VERSION).toBe(1)
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
})
