import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CUSTOM_DEFINITIONS } from './data/custom'
import {
  CATALOG,
  exerciseById,
  exerciseImages,
  exerciseName,
  imageUrl,
  searchExercises,
} from './catalog'

describe('exerciseName', () => {
  it('nome do acervo', () => {
    expect(exerciseName('Hammer_Curls')).toBe('Hammer Curls')
  })

  it('nome da entrada própria', () => {
    expect(exerciseName('cg:reverse-fly')).toBe('Reverse Fly')
  })

  it('legacy: devolve o nome original', () => {
    expect(exerciseName('legacy:Supino reto')).toBe('Supino reto')
  })

  it('id desconhecido devolve o próprio id', () => {
    expect(exerciseName('Nao_Existe')).toBe('Nao_Existe')
  })
})

describe('exerciseById', () => {
  it('acha o acervo e as entradas próprias', () => {
    expect(exerciseById('Hammer_Curls')?.name).toBe('Hammer Curls')
    expect(exerciseById('cg:pullup-lat-pulldown')?.name).toBe('Pull-up / Lat Pulldown')
  })

  it('legacy: não está no catálogo', () => {
    expect(exerciseById('legacy:Supino reto')).toBeUndefined()
  })
})

describe('entradas próprias (cg:)', () => {
  it('toda foto de origem existe no acervo, na ordem definida', () => {
    for (const definition of CUSTOM_DEFINITIONS) {
      const entry = exerciseById(definition.id)
      expect(entry?.variants.map((variant) => variant.sourceId)).toEqual(definition.sources)
    }
  })

  it('a foto padrão da elevação lateral na polia é a em pé', () => {
    expect(exerciseById('cg:cable-lateral-raise')?.variants[0]?.sourceId).toBe(
      'Standing_Low-Pulley_Deltoid_Raise',
    )
  })

  it('o agachamento búlgaro tem 3 variantes', () => {
    expect(exerciseById('cg:bulgarian-split-squat')?.variants).toHaveLength(3)
  })
})

describe('integridade do catálogo', () => {
  it('ids são únicos', () => {
    expect(new Set(CATALOG.map((exercise) => exercise.id)).size).toBe(CATALOG.length)
  })

  it('todo exercício tem ≥ 1 variante com 2 fotos que existem em public/', () => {
    const missing: string[] = []
    for (const exercise of CATALOG) {
      expect(exercise.variants.length).toBeGreaterThan(0)
      for (const variant of exercise.variants) {
        expect(variant.images).toHaveLength(2)
        for (const image of variant.images) {
          if (!existsSync(path.join(process.cwd(), 'public/exercises', image))) missing.push(image)
        }
      }
    }
    expect(missing).toEqual([])
  })
})

describe('imagens', () => {
  it('imageUrl aponta para /exercises', () => {
    expect(imageUrl('Hammer_Curls/0.webp')).toBe('/exercises/Hammer_Curls/0.webp')
  })

  it('exerciseImages devolve [início, fim] por variante', () => {
    const images = exerciseImages('cg:reverse-fly')
    expect(images).toHaveLength(2)
    expect(images[0]).toEqual([
      '/exercises/Reverse_Machine_Flyes/0.webp',
      '/exercises/Reverse_Machine_Flyes/1.webp',
    ])
  })

  it('legacy: não tem foto', () => {
    expect(exerciseImages('legacy:Supino reto')).toEqual([])
  })
})

describe('searchExercises', () => {
  it('busca no catálogo inteiro', () => {
    expect(searchExercises('hammer curl').map((exercise) => exercise.id)).toContain('Hammer_Curls')
  })

  it('prioriza ids da ficha', () => {
    expect(searchExercises('curl', ['Hammer_Curls'])[0]?.id).toBe('Hammer_Curls')
  })
})
