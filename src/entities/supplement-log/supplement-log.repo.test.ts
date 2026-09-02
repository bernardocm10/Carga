import { beforeEach, describe, expect, it } from 'vitest'
import { loadSupplementLog, saveSupplementLog } from './supplement-log.repo'

beforeEach(() => {
  localStorage.clear()
})

describe('supplement-log repo', () => {
  it('devolve lista vazia sem nada salvo', () => {
    expect(loadSupplementLog()).toEqual([])
  })

  it('faz round-trip e mantém ordenado por data', () => {
    saveSupplementLog([
      { date: '2026-08-10', taken: ['Creatina'] },
      { date: '2026-08-08', taken: ['Creatina', 'Pré-treino'] },
    ])
    expect(loadSupplementLog().map((d) => d.date)).toEqual(['2026-08-08', '2026-08-10'])
  })

  it('cai pra lista vazia com JSON corrompido', () => {
    localStorage.setItem('cg:supplementLog', '{quebrado')
    expect(loadSupplementLog()).toEqual([])
  })
})
