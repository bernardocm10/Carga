import { describe, expect, it } from 'vitest'
import { db } from '@/shared/db'
import { bootstrap } from './bootstrap'

describe('bootstrap', () => {
  it('importa o legado do localStorage pro banco', async () => {
    localStorage.setItem('cg:weightLog', JSON.stringify([{ date: '2026-08-10', kg: 80 }]))
    await bootstrap()
    expect(await db.table('weightLog').toArray()).toEqual([{ date: '2026-08-10', kg: 80 }])
  })
})
