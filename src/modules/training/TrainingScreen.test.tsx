import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONFIG_SEED, useConfigStore } from '@/entities/config'
import { useTrainingLogStore } from '@/entities/training-log'
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
          exercises: [{ name: 'Supino reto', sets: 4, reps: '4-6' }],
        },
      ],
    })
    render(<TrainingScreen />)

    await user.click(screen.getByRole('button', { name: 'Seg' }))
    await user.type(screen.getByLabelText('Peso'), '40')
    await user.type(screen.getByLabelText('Reps'), '6')
    await user.click(screen.getByRole('button', { name: '+' }))

    const stored: unknown = JSON.parse(localStorage.getItem('cg:trainingLog') ?? '[]')
    expect(stored).toEqual([
      expect.objectContaining({
        dayName: 'Push A',
        exercises: [{ name: 'Supino reto', sets: [{ weight: 40, reps: 6 }] }],
      }),
    ])
    expect(screen.getByText('40kg × 6')).toBeInTheDocument()
  })
})
