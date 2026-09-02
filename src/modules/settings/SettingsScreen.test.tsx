import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Config } from '@/entities/config'
import { CONFIG_SEED, useConfigStore } from '@/entities/config'
import { useThemeStore } from '@/shared/theme'
import { SettingsScreen } from './SettingsScreen'

beforeEach(() => {
  localStorage.clear()
  useConfigStore.getState().replaceConfig(CONFIG_SEED)
  useThemeStore.setState({ theme: 'light' })
  delete document.documentElement.dataset.theme
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

  it('troca o tema e persiste', async () => {
    const user = userEvent.setup()
    render(<SettingsScreen />)

    await user.click(screen.getByRole('button', { name: 'Escuro' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(JSON.parse(localStorage.getItem('cg:theme') ?? 'null')).toBe('dark')
  })

  it('abre um dia só ao tocar no cabeçalho', async () => {
    const user = userEvent.setup()
    render(<SettingsScreen />)

    expect(screen.queryByRole('button', { name: /adicionar exercício/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /ombro \+ peito sup/i }))

    expect(screen.getByRole('button', { name: /adicionar exercício/i })).toBeInTheDocument()
  })

  it('adiciona um exercício ao dia aberto', async () => {
    const user = userEvent.setup()
    useConfigStore.getState().replaceConfig({
      ...CONFIG_SEED,
      trainingSplit: CONFIG_SEED.trainingSplit.map((day) => ({ ...day, exercises: [] })),
    })
    render(<SettingsScreen />)

    await user.click(screen.getByRole('button', { name: /ombro \+ peito sup/i }))
    await user.click(screen.getByRole('button', { name: /adicionar exercício/i }))

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

    await user.click(screen.getByRole('button', { name: /push a/i }))
    await user.click(screen.getByRole('button', { name: /remover exercício/i }))

    await waitFor(() => {
      expect(storedConfig().trainingSplit.find((day) => day.weekday === 1)?.exercises).toEqual([])
    })
  })
})
