import { beforeEach, describe, expect, it } from 'vitest'
import { loadTrainingLog, saveTrainingLog } from './training-log.repo'

beforeEach(() => {
  localStorage.clear()
})

describe('training-log repo', () => {
  it('devolve lista vazia sem nada salvo', () => {
    expect(loadTrainingLog()).toEqual([])
  })

  it('faz round-trip e mantém ordenado por data', () => {
    saveTrainingLog([
      { date: '2026-08-10', dayName: 'Pull A', exercises: [] },
      { date: '2026-08-08', dayName: 'Push A', exercises: [] },
    ])
    expect(loadTrainingLog().map((s) => s.date)).toEqual(['2026-08-08', '2026-08-10'])
  })

  it('cai pra lista vazia com JSON corrompido', () => {
    localStorage.setItem('cg:trainingLog', '{quebrado')
    expect(loadTrainingLog()).toEqual([])
  })
})
