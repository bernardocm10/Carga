import { describe, expect, it } from 'vitest'
import { deleteSession, loadTrainingLog, putSession } from './training-log.repo'

describe('training-log repo', () => {
  it('devolve lista vazia sem nada salvo', async () => {
    expect(await loadTrainingLog()).toEqual([])
  })

  it('grava e devolve ordenado por data', async () => {
    await putSession({ date: '2026-08-10', dayName: 'Pull A', exercises: [] })
    await putSession({ date: '2026-08-08', dayName: 'Push A', exercises: [] })
    expect((await loadTrainingLog()).map((s) => s.date)).toEqual(['2026-08-08', '2026-08-10'])
  })

  it('apaga por data', async () => {
    await putSession({ date: '2026-08-10', dayName: 'Pull A', exercises: [] })
    await deleteSession('2026-08-10')
    expect(await loadTrainingLog()).toEqual([])
  })
})
