import { describe, expect, it } from 'vitest'
import { deleteSupplementDay, loadSupplementLog, putSupplementDay } from './supplement-log.repo'

describe('supplement-log repo', () => {
  it('devolve lista vazia sem nada salvo', async () => {
    expect(await loadSupplementLog()).toEqual([])
  })

  it('grava e devolve ordenado por data', async () => {
    await putSupplementDay({ date: '2026-08-10', taken: ['Creatina'] })
    await putSupplementDay({ date: '2026-08-08', taken: ['Creatina', 'Pré-treino'] })
    expect((await loadSupplementLog()).map((d) => d.date)).toEqual(['2026-08-08', '2026-08-10'])
  })

  it('apaga por data', async () => {
    await putSupplementDay({ date: '2026-08-10', taken: ['Creatina'] })
    await deleteSupplementDay('2026-08-10')
    expect(await loadSupplementLog()).toEqual([])
  })
})
