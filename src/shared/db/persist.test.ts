import { describe, expect, it, vi } from 'vitest'
import { db } from './db'
import { persist, settled } from './persist'

describe('persist', () => {
  it('settled espera a escrita disparada', async () => {
    persist(db.table('weightLog').put({ date: '2026-08-10', kg: 80 }))
    await settled()
    expect(await db.table('weightLog').get('2026-08-10')).toEqual({ date: '2026-08-10', kg: 80 })
  })

  it('settled sem nada pendente resolve na hora', async () => {
    await expect(settled()).resolves.toBeUndefined()
  })

  it('falha de escrita não lança e vai pro console', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    persist(Promise.reject(new Error('quota')))
    await settled()
    expect(error).toHaveBeenCalledWith('[db] escrita falhou', expect.any(Error))
    error.mockRestore()
  })
})
