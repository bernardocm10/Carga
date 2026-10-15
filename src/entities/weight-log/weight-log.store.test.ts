import { beforeEach, describe, expect, it } from 'vitest'
import { db, settled } from '@/shared/db'
import { useWeightLogStore } from './weight-log.store'

beforeEach(() => {
  useWeightLogStore.setState({ entries: [] })
})

describe('weight-log store', () => {
  it('hydrate carrega do banco', async () => {
    await db.table('weightLog').put({ date: '2026-08-10', kg: 80 })
    await useWeightLogStore.getState().hydrate()
    expect(useWeightLogStore.getState().entries).toEqual([{ date: '2026-08-10', kg: 80 }])
  })

  it('addEntry atualiza a memória na hora e grava no banco', async () => {
    useWeightLogStore.getState().addEntry({ date: '2026-08-10', kg: 80 })
    expect(useWeightLogStore.getState().entries).toEqual([{ date: '2026-08-10', kg: 80 }])
    await settled()
    expect(await db.table('weightLog').toArray()).toEqual([{ date: '2026-08-10', kg: 80 }])
  })

  it('removeEntry apaga do banco', async () => {
    useWeightLogStore.getState().addEntry({ date: '2026-08-10', kg: 80 })
    useWeightLogStore.getState().removeEntry('2026-08-10')
    await settled()
    expect(useWeightLogStore.getState().entries).toEqual([])
    expect(await db.table('weightLog').count()).toBe(0)
  })
})
