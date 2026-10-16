import { describe, expect, it } from 'vitest'
import { useConfigStore } from '@/entities/config'
import { useImageChoiceStore } from '@/entities/exercise-catalog'
import { useSupplementLogStore } from '@/entities/supplement-log'
import { useTrainingLogStore } from '@/entities/training-log'
import { useWeightLogStore } from '@/entities/weight-log'
import { db } from '@/shared/db'
import { bootstrap } from './bootstrap'

describe('bootstrap', () => {
  it('importa o legado e hidrata os stores', async () => {
    localStorage.setItem(
      'cg:config',
      JSON.stringify({ ...useConfigStore.getState().config, targetCalories: 3300 }),
    )
    localStorage.setItem('cg:weightLog', JSON.stringify([{ date: '2026-08-10', kg: 80 }]))

    await bootstrap()

    expect(await db.table('weightLog').toArray()).toEqual([{ date: '2026-08-10', kg: 80 }])
    expect(useConfigStore.getState().config.targetCalories).toBe(3300)
    expect(useWeightLogStore.getState().entries).toEqual([{ date: '2026-08-10', kg: 80 }])
  })

  it('hidrata o store de peso a partir do banco', async () => {
    await db.table('weightLog').put({ date: '2026-08-10', kg: 80 })
    await bootstrap()
    expect(useWeightLogStore.getState().entries).toEqual([{ date: '2026-08-10', kg: 80 }])
  })

  it('hidrata o store de suplementos a partir do banco', async () => {
    await db.table('supplementLog').put({ date: '2026-08-10', taken: ['Creatina'] })
    await bootstrap()
    expect(useSupplementLogStore.getState().days).toEqual([
      { date: '2026-08-10', taken: ['Creatina'] },
    ])
  })

  it('hidrata o store de treino a partir do banco', async () => {
    await db.table('trainingLog').put({ date: '2026-08-10', dayName: 'Push A', exercises: [] })
    await bootstrap()
    expect(useTrainingLogStore.getState().sessions).toEqual([
      { date: '2026-08-10', dayName: 'Push A', exercises: [] },
    ])
  })

  it('hidrata as escolhas de foto a partir do banco', async () => {
    await db.table('imageChoice').put({ exerciseId: 'cg:reverse-fly', variantIndex: 1 })
    await bootstrap()
    expect(useImageChoiceStore.getState().choices).toEqual({ 'cg:reverse-fly': 1 })
  })
})
