import { beforeEach, describe, expect, it } from 'vitest'
import { loadWeightLog, saveWeightLog } from './weight-log.repo'

beforeEach(() => {
  localStorage.clear()
})

describe('weight-log repo', () => {
  it('devolve lista vazia sem nada salvo', () => {
    expect(loadWeightLog()).toEqual([])
  })

  it('faz round-trip e mantém ordenado por data', () => {
    saveWeightLog([
      { date: '2026-08-10', kg: 80.2 },
      { date: '2026-08-08', kg: 80.0 },
    ])
    expect(loadWeightLog()).toEqual([
      { date: '2026-08-08', kg: 80.0 },
      { date: '2026-08-10', kg: 80.2 },
    ])
  })

  it('cai pra lista vazia com JSON corrompido', () => {
    localStorage.setItem('cg:weightLog', '{quebrado')
    expect(loadWeightLog()).toEqual([])
  })
})
