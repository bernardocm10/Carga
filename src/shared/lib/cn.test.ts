import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('junta classes verdadeiras', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('descarta valores falsy', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('retorna string vazia sem argumentos', () => {
    expect(cn()).toBe('')
  })
})
