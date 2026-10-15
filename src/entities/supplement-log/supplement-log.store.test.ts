import { beforeEach, describe, expect, it } from 'vitest'
import { db, settled } from '@/shared/db'
import { useSupplementLogStore } from './supplement-log.store'

beforeEach(() => {
  useSupplementLogStore.setState({ days: [] })
})

describe('supplement-log store', () => {
  it('hydrate carrega do banco', async () => {
    await db.table('supplementLog').put({ date: '2026-08-10', taken: ['Creatina'] })
    await useSupplementLogStore.getState().hydrate()
    expect(useSupplementLogStore.getState().days).toEqual([
      { date: '2026-08-10', taken: ['Creatina'] },
    ])
  })

  it('toggle marca e grava o dia', async () => {
    useSupplementLogStore.getState().toggle('2026-08-10', 'Creatina')
    await settled()
    expect(await db.table('supplementLog').toArray()).toEqual([
      { date: '2026-08-10', taken: ['Creatina'] },
    ])
  })

  it('desmarcar o último apaga o dia do banco', async () => {
    useSupplementLogStore.getState().toggle('2026-08-10', 'Creatina')
    useSupplementLogStore.getState().toggle('2026-08-10', 'Creatina')
    await settled()
    expect(useSupplementLogStore.getState().days).toEqual([])
    expect(await db.table('supplementLog').count()).toBe(0)
  })
})
