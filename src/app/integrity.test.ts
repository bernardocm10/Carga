import { describe, expect, it } from 'vitest'
import { exerciseById } from '@/entities/exercise-catalog'
import { LEGACY_NAME_MAP } from '@/shared/db'

describe('integridade entre camadas', () => {
  it('todo id do mapa de migração existe no catálogo', () => {
    const missing = Object.entries(LEGACY_NAME_MAP).filter(
      ([, id]) => exerciseById(id) === undefined,
    )
    expect(missing).toEqual([])
  })
})
