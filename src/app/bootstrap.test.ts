import { describe, expect, it } from 'vitest'
import { useWeightLogStore } from '@/entities/weight-log'
import { db } from '@/shared/db'
import { bootstrap } from './bootstrap'

describe('bootstrap', () => {
  it('importa o legado do localStorage pro banco', async () => {
    localStorage.setItem('cg:weightLog', JSON.stringify([{ date: '2026-08-10', kg: 80 }]))
    await bootstrap()
    expect(await db.table('weightLog').toArray()).toEqual([{ date: '2026-08-10', kg: 80 }])
  })

  it('hidrata o store de peso a partir do banco', async () => {
    await db.table('weightLog').put({ date: '2026-08-10', kg: 80 })
    await bootstrap()
    expect(useWeightLogStore.getState().entries).toEqual([{ date: '2026-08-10', kg: 80 }])
  })
})
