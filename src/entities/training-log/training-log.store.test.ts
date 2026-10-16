import { beforeEach, describe, expect, it } from 'vitest'
import { db, settled } from '@/shared/db'
import { useTrainingLogStore } from './training-log.store'

beforeEach(() => {
  useTrainingLogStore.setState({ sessions: [] })
})

describe('training-log store', () => {
  it('hydrate carrega do banco', async () => {
    await db.table('trainingLog').put({ date: '2026-08-10', dayName: 'Push A', exercises: [] })
    await useTrainingLogStore.getState().hydrate()
    expect(useTrainingLogStore.getState().sessions).toEqual([
      { date: '2026-08-10', dayName: 'Push A', exercises: [] },
    ])
  })

  it('logSet grava a sessão do dia', async () => {
    useTrainingLogStore
      .getState()
      .logSet('2026-08-10', 'Push A', 'Hammer_Curls', { weight: 40, reps: 6 })
    useTrainingLogStore
      .getState()
      .logSet('2026-08-10', 'Push A', 'Hammer_Curls', { weight: 42, reps: 5 })
    await settled()
    expect(await db.table('trainingLog').toArray()).toEqual([
      {
        date: '2026-08-10',
        dayName: 'Push A',
        exercises: [
          {
            exerciseId: 'Hammer_Curls',
            sets: [
              { weight: 40, reps: 6 },
              { weight: 42, reps: 5 },
            ],
          },
        ],
      },
    ])
  })

  it('removeSet da última série apaga a sessão do banco', async () => {
    useTrainingLogStore
      .getState()
      .logSet('2026-08-10', 'Push A', 'Hammer_Curls', { weight: 40, reps: 6 })
    useTrainingLogStore.getState().removeSet('2026-08-10', 'Hammer_Curls', 0)
    await settled()
    expect(useTrainingLogStore.getState().sessions).toEqual([])
    expect(await db.table('trainingLog').count()).toBe(0)
  })

  it('removeSet com outras séries regrava a sessão', async () => {
    useTrainingLogStore
      .getState()
      .logSet('2026-08-10', 'Push A', 'Hammer_Curls', { weight: 40, reps: 6 })
    useTrainingLogStore
      .getState()
      .logSet('2026-08-10', 'Push A', 'Seated_Cable_Rows', { weight: 30, reps: 8 })
    useTrainingLogStore.getState().removeSet('2026-08-10', 'Hammer_Curls', 0)
    await settled()
    expect(await db.table('trainingLog').get('2026-08-10')).toEqual({
      date: '2026-08-10',
      dayName: 'Push A',
      exercises: [{ exerciseId: 'Seated_Cable_Rows', sets: [{ weight: 30, reps: 8 }] }],
    })
  })

  it('removeSession apaga do banco', async () => {
    useTrainingLogStore
      .getState()
      .logSet('2026-08-10', 'Push A', 'Hammer_Curls', { weight: 40, reps: 6 })
    useTrainingLogStore.getState().removeSession('2026-08-10')
    await settled()
    expect(await db.table('trainingLog').count()).toBe(0)
  })
})
