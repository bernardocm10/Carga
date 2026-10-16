import { describe, expect, it } from 'vitest'
import type { CatalogExercise } from './exercise-catalog.types'
import { searchIn } from './search'

function make(id: string, name: string): CatalogExercise {
  return {
    id,
    name,
    primaryMuscles: [],
    equipment: null,
    variants: [{ sourceId: id, images: [`${id}/0.webp`, `${id}/1.webp`] }],
  }
}

const LIST = [
  make('A', 'Barbell Curl'),
  make('B', 'Hammer Curls'),
  make('C', 'Crunches'),
  make('D', 'Café Press'),
]

describe('searchIn', () => {
  it('busca por substring sem diferenciar caixa', () => {
    expect(searchIn(LIST, 'CURL').map((e) => e.id)).toEqual(['A', 'B'])
  })

  it('ignora acento na busca e no nome', () => {
    expect(searchIn(LIST, 'cafe').map((e) => e.id)).toEqual(['D'])
    expect(searchIn(LIST, 'Café').map((e) => e.id)).toEqual(['D'])
  })

  it('ids prioritários vêm primeiro', () => {
    expect(searchIn(LIST, 'curl', ['B']).map((e) => e.id)).toEqual(['B', 'A'])
  })

  it('consulta vazia devolve tudo, prioritários primeiro', () => {
    expect(searchIn(LIST, '  ', ['C']).map((e) => e.id)).toEqual(['C', 'A', 'B', 'D'])
  })

  it('sem resultado devolve lista vazia', () => {
    expect(searchIn(LIST, 'zzz')).toEqual([])
  })

  it('limita a 50 resultados', () => {
    const many = Array.from({ length: 80 }, (_, i) => make(`X${i}`, `Curl ${i}`))
    expect(searchIn(many, 'curl')).toHaveLength(50)
  })
})
