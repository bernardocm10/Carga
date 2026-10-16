import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONFIG_SEED, useConfigStore } from '@/entities/config'
import { useTrainingLogStore } from '@/entities/training-log'
import { db, settled } from '@/shared/db'
import { TrainingScreen } from './TrainingScreen'

beforeEach(() => {
  localStorage.clear()
  useConfigStore.getState().replaceConfig(CONFIG_SEED)
  useTrainingLogStore.setState({ sessions: [] })
})

describe('TrainingScreen', () => {
  it('mostra o empty-state num dia sem exercícios', () => {
    useConfigStore.getState().replaceConfig({
      ...CONFIG_SEED,
      trainingSplit: CONFIG_SEED.trainingSplit.map((day) => ({ ...day, exercises: [] })),
    })
    render(<TrainingScreen />)
    expect(screen.getByRole('heading', { name: /treino/i })).toBeInTheDocument()
    expect(screen.getByText(/configure na aba ajustes/i)).toBeInTheDocument()
  })

  it('lança uma série e persiste no log', async () => {
    const user = userEvent.setup()
    useConfigStore.getState().replaceConfig({
      ...CONFIG_SEED,
      trainingSplit: [
        {
          weekday: 1,
          name: 'Push A',
          focus: 'Força',
          exercises: [{ exerciseId: 'Hammer_Curls', sets: 4, reps: '4-6' }],
        },
      ],
    })
    render(<TrainingScreen />)

    await user.click(screen.getByRole('button', { name: 'Seg' }))
    await user.type(screen.getByLabelText('Peso'), '40')
    await user.type(screen.getByLabelText('Reps'), '6')
    await user.click(screen.getByRole('button', { name: '+' }))

    await settled()
    const stored: unknown = await db.table('trainingLog').toArray()
    expect(stored).toEqual([
      expect.objectContaining({
        dayName: 'Push A',
        exercises: [{ exerciseId: 'Hammer_Curls', sets: [{ weight: 40, reps: 6 }] }],
      }),
    ])
    expect(screen.getByText('40kg × 6')).toBeInTheDocument()
    expect(screen.getByText('Hammer Curls')).toBeInTheDocument()
  })

  it('mostra o nome original de um exercício legacy', () => {
    useConfigStore.getState().replaceConfig({
      ...CONFIG_SEED,
      trainingSplit: [
        {
          weekday: 1,
          name: 'Push A',
          focus: 'Força',
          exercises: [{ exerciseId: 'legacy:Supino reto', sets: 4, reps: '4-6' }],
        },
      ],
    })
    render(<TrainingScreen />)

    fireEvent.click(screen.getByRole('button', { name: 'Seg' }))

    expect(screen.getByText('Supino reto')).toBeInTheDocument()
  })

  it('exercício repetido no dia renderiza duas linhas sem erro de key', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    useConfigStore.getState().replaceConfig({
      ...CONFIG_SEED,
      trainingSplit: [
        {
          weekday: 1,
          name: 'Push A',
          focus: 'Força',
          exercises: [
            { exerciseId: 'Hammer_Curls', sets: 3, reps: '8' },
            { exerciseId: 'Hammer_Curls', sets: 2, reps: '12' },
          ],
        },
      ],
    })
    render(<TrainingScreen />)

    fireEvent.click(screen.getByRole('button', { name: 'Seg' }))

    expect(screen.getAllByText('Hammer Curls')).toHaveLength(2)
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })
})
