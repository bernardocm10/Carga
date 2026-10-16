import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { db, settled } from '@/shared/db'
import { useImageChoice, useImageChoiceStore } from './image-choice.store'

beforeEach(() => {
  useImageChoiceStore.setState({ choices: {} })
})

describe('image-choice store', () => {
  it('sem escolha salva, a variante padrão é 0', () => {
    const { result } = renderHook(() => useImageChoice('cg:reverse-fly'))
    expect(result.current.selected).toBe(0)
  })

  it('select atualiza na hora e grava no banco', async () => {
    const { result } = renderHook(() => useImageChoice('cg:reverse-fly'))

    act(() => {
      result.current.select(1)
    })

    await settled()
    expect(useImageChoiceStore.getState().choices).toEqual({ 'cg:reverse-fly': 1 })
    expect(await db.table('imageChoice').toArray()).toEqual([
      { exerciseId: 'cg:reverse-fly', variantIndex: 1 },
    ])
  })

  it('hydrate reidrata as escolhas salvas', async () => {
    await db.table('imageChoice').put({ exerciseId: 'cg:reverse-fly', variantIndex: 1 })
    await useImageChoiceStore.getState().hydrate()
    const { result } = renderHook(() => useImageChoice('cg:reverse-fly'))
    expect(result.current.selected).toBe(1)
  })

  it('escolher de novo sobrescreve', async () => {
    useImageChoiceStore.getState().select('cg:reverse-fly', 1)
    useImageChoiceStore.getState().select('cg:reverse-fly', 0)
    await settled()
    expect(await db.table('imageChoice').toArray()).toEqual([
      { exerciseId: 'cg:reverse-fly', variantIndex: 0 },
    ])
  })
})
