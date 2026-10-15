import { describe, expect, it } from 'vitest'
import { deleteWeightEntry, loadWeightLog, putWeightEntry } from './weight-log.repo'

describe('weight-log repo', () => {
  it('devolve lista vazia sem nada salvo', async () => {
    expect(await loadWeightLog()).toEqual([])
  })

  it('grava e devolve ordenado por data', async () => {
    await putWeightEntry({ date: '2026-08-10', kg: 80.2 })
    await putWeightEntry({ date: '2026-08-08', kg: 80.0 })
    expect(await loadWeightLog()).toEqual([
      { date: '2026-08-08', kg: 80.0 },
      { date: '2026-08-10', kg: 80.2 },
    ])
  })

  it('put na mesma data sobrescreve', async () => {
    await putWeightEntry({ date: '2026-08-10', kg: 80 })
    await putWeightEntry({ date: '2026-08-10', kg: 81 })
    expect(await loadWeightLog()).toEqual([{ date: '2026-08-10', kg: 81 }])
  })

  it('apaga por data', async () => {
    await putWeightEntry({ date: '2026-08-10', kg: 80 })
    await deleteWeightEntry('2026-08-10')
    expect(await loadWeightLog()).toEqual([])
  })
})
