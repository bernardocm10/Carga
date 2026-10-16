import { describe, expect, it } from 'vitest'
import { CONFIG_SEED } from '@/entities/config'
import { exerciseById } from '@/entities/exercise-catalog'
import { LEGACY_NAME_MAP } from '@/shared/db'

describe('integridade entre camadas', () => {
  it('todo id do mapa de migração existe no catálogo', () => {
    const missing = Object.entries(LEGACY_NAME_MAP).filter(
      ([, id]) => exerciseById(id) === undefined,
    )
    expect(missing).toEqual([])
  })

  it('todo exercício da ficha semente existe no catálogo', () => {
    const ids = CONFIG_SEED.trainingSplit.flatMap((day) =>
      day.exercises.map((exercise) => exercise.exerciseId),
    )
    expect(ids.length).toBeGreaterThan(0)
    expect(ids.filter((id) => exerciseById(id) === undefined)).toEqual([])
  })
})
