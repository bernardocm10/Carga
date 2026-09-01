import { beforeEach, describe, expect, it } from 'vitest'
import { kvGet, kvRemove, kvSet } from './index'

beforeEach(() => {
  localStorage.clear()
})

describe('kvGet', () => {
  it('devolve o fallback quando a chave não existe', () => {
    expect(kvGet('missing', { n: 1 })).toEqual({ n: 1 })
  })

  it('devolve o fallback quando o JSON é inválido', () => {
    localStorage.setItem('cg:broken', '{not json')
    expect(kvGet('broken', 'default')).toBe('default')
  })

  it('faz round-trip com kvSet', () => {
    kvSet('config', { targetCalories: 3150 })
    expect(kvGet('config', null)).toEqual({ targetCalories: 3150 })
  })

  it('usa o prefixo cg:', () => {
    kvSet('foo', 1)
    expect(localStorage.getItem('cg:foo')).toBe('1')
  })
})

describe('kvRemove', () => {
  it('apaga a chave', () => {
    kvSet('foo', 1)
    kvRemove('foo')
    expect(kvGet('foo', 'gone')).toBe('gone')
  })
})
