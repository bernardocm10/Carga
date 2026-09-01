import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Config } from '@/entities/config'
import { CONFIG_SEED, useConfigStore } from '@/entities/config'
import { SettingsScreen } from './SettingsScreen'

beforeEach(() => {
  localStorage.clear()
  useConfigStore.getState().replaceConfig(CONFIG_SEED)
})

function storedConfig(): Config {
  return JSON.parse(localStorage.getItem('cg:config') ?? '{}') as Config
}

describe('SettingsScreen', () => {
  it('edita uma meta de macro e persiste ao sair do campo', async () => {
    const user = userEvent.setup()
    render(<SettingsScreen />)

    const protein = screen.getByLabelText(/proteína/i)
    await user.clear(protein)
    await user.type(protein, '185')
    await user.tab()

    expect(storedConfig().macros.protein).toBe(185)
  })

  it('adiciona um exercício a um dia de treino', async () => {
    const user = userEvent.setup()
    render(<SettingsScreen />)

    const addButtons = screen.getAllByRole('button', { name: /adicionar exercício/i })
    await user.click(addButtons[0]!)

    const monday = storedConfig().trainingSplit.find((day) => day.weekday === 1)
    expect(monday?.exercises).toEqual([{ name: 'Novo exercício', sets: 3, reps: '8-12' }])
  })

  it('remove um exercício após a animação de saída', async () => {
    const user = userEvent.setup()
    useConfigStore.getState().replaceConfig({
      ...CONFIG_SEED,
      trainingSplit: [
        {
          weekday: 1,
          name: 'Push A',
          focus: 'Força',
          exercises: [{ name: 'Supino', sets: 4, reps: '5' }],
        },
      ],
    })
    render(<SettingsScreen />)

    await user.click(screen.getByRole('button', { name: /remover exercício/i }))

    await waitFor(() => {
      expect(storedConfig().trainingSplit.find((day) => day.weekday === 1)?.exercises).toEqual([])
    })
  })
})
