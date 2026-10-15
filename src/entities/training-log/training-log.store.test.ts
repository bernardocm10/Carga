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
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Supino', { weight: 40, reps: 6 })
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Supino', { weight: 42, reps: 5 })
    await settled()
    expect(await db.table('trainingLog').toArray()).toEqual([
      {
        date: '2026-08-10',
        dayName: 'Push A',
        exercises: [
          {
            name: 'Supino',
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
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Supino', { weight: 40, reps: 6 })
    useTrainingLogStore.getState().removeSet('2026-08-10', 'Supino', 0)
    await settled()
    expect(useTrainingLogStore.getState().sessions).toEqual([])
    expect(await db.table('trainingLog').count()).toBe(0)
  })

  it('removeSet com outras séries regrava a sessão', async () => {
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Supino', { weight: 40, reps: 6 })
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Remada', { weight: 30, reps: 8 })
    useTrainingLogStore.getState().removeSet('2026-08-10', 'Supino', 0)
    await settled()
    expect(await db.table('trainingLog').get('2026-08-10')).toEqual({
      date: '2026-08-10',
      dayName: 'Push A',
      exercises: [{ name: 'Remada', sets: [{ weight: 30, reps: 8 }] }],
    })
  })

  it('removeSession apaga do banco', async () => {
    useTrainingLogStore.getState().logSet('2026-08-10', 'Push A', 'Supino', { weight: 40, reps: 6 })
    useTrainingLogStore.getState().removeSession('2026-08-10')
    await settled()
    expect(await db.table('trainingLog').count()).toBe(0)
  })
})
