import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Config } from '@/entities/config'
import { CONFIG_SEED, useConfigStore } from '@/entities/config'
import { CONFIG_ROW_ID, db, exportAll, settled } from '@/shared/db'
import { useThemeStore } from '@/shared/theme'
import { SettingsScreen } from './SettingsScreen'
import { shareTextFile } from '@/shared/lib/shareFile'
import { reloadApp } from '@/shared/lib/reloadApp'

vi.mock('@/shared/lib/shareFile', () => ({ shareTextFile: vi.fn(() => Promise.resolve()) }))
vi.mock('@/shared/lib/reloadApp', () => ({ reloadApp: vi.fn() }))

function backupFile(json: string): File {
  return new File([json], 'backup.json', { type: 'application/json' })
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  localStorage.clear()
  useConfigStore.getState().replaceConfig(CONFIG_SEED)
  useThemeStore.setState({ theme: 'light' })
  delete document.documentElement.dataset.theme
})

async function storedConfig(): Promise<Config> {
  await settled()
  const row = await db.table<{ id: string; config: Config }, string>('config').get(CONFIG_ROW_ID)
  if (row === undefined) throw new Error('config não gravada')
  return row.config
}

describe('SettingsScreen', () => {
  it('edita uma meta de macro e persiste ao sair do campo', async () => {
    const user = userEvent.setup()
    render(<SettingsScreen />)

    const protein = screen.getByLabelText(/proteína/i)
    await user.clear(protein)
    await user.type(protein, '185')
    await user.tab()

    expect((await storedConfig()).macros.protein).toBe(185)
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

  it('adiciona o exercício escolhido no seletor', async () => {
    const user = userEvent.setup()
    useConfigStore.getState().replaceConfig({
      ...CONFIG_SEED,
      trainingSplit: CONFIG_SEED.trainingSplit.map((day) => ({ ...day, exercises: [] })),
    })
    render(<SettingsScreen />)

    await user.click(screen.getByRole('button', { name: /ombro \+ peito sup/i }))
    await user.click(screen.getByRole('button', { name: /adicionar exercício/i }))
    await user.type(screen.getByLabelText('Buscar'), 'romanian')
    await user.click(screen.getByText('Romanian Deadlift'))

    const monday = (await storedConfig()).trainingSplit.find((day) => day.weekday === 1)
    expect(monday?.exercises).toEqual([{ exerciseId: 'Romanian_Deadlift', sets: 3, reps: '8-12' }])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('troca o exercício pelo seletor mantendo séries e reps', async () => {
    const user = userEvent.setup()
    useConfigStore.getState().replaceConfig({
      ...CONFIG_SEED,
      trainingSplit: [
        {
          weekday: 1,
          name: 'Push A',
          focus: 'Força',
          exercises: [{ exerciseId: 'Leg_Press', sets: 4, reps: '5' }],
        },
      ],
    })
    render(<SettingsScreen />)

    await user.click(screen.getByRole('button', { name: /push a/i }))
    await user.click(screen.getByRole('button', { name: /trocar exercício leg press/i }))
    await user.type(screen.getByLabelText('Buscar'), 'romanian')
    await user.click(screen.getByText('Romanian Deadlift'))

    const monday = (await storedConfig()).trainingSplit.find((day) => day.weekday === 1)
    expect(monday?.exercises).toEqual([{ exerciseId: 'Romanian_Deadlift', sets: 4, reps: '5' }])
  })

  it('o seletor mostra aviso quando a busca não acha nada', async () => {
    const user = userEvent.setup()
    render(<SettingsScreen />)

    await user.click(screen.getByRole('button', { name: /ombro \+ peito sup/i }))
    await user.click(screen.getByRole('button', { name: /adicionar exercício/i }))
    await user.type(screen.getByLabelText('Buscar'), 'zzzzzz')

    expect(screen.getByText('Nenhum exercício encontrado.')).toBeInTheDocument()
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
          exercises: [{ exerciseId: 'Leg_Press', sets: 4, reps: '5' }],
        },
      ],
    })
    render(<SettingsScreen />)

    await user.click(screen.getByRole('button', { name: /push a/i }))
    await user.click(screen.getByRole('button', { name: /remover exercício/i }))

    await waitFor(async () => {
      expect(
        (await storedConfig()).trainingSplit.find((day) => day.weekday === 1)?.exercises,
      ).toEqual([])
    })
  })
})

describe('SettingsScreen · backup', () => {
  it('o seletor de arquivo não filtra por tipo (backup pode chegar como octet-stream)', () => {
    render(<SettingsScreen />)
    expect(screen.getByLabelText(/importar backup/i)).not.toHaveAttribute('accept')
  })

  it('exporta o backup com nome datado', async () => {
    const user = userEvent.setup()
    render(<SettingsScreen />)

    await user.click(screen.getByRole('button', { name: /exportar backup/i }))

    await waitFor(() => expect(shareTextFile).toHaveBeenCalledOnce())
    const [filename, text] = vi.mocked(shareTextFile).mock.calls[0] ?? []
    expect(filename).toMatch(/^carga-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(JSON.parse(text ?? '{}')).toMatchObject({ app: 'claudgym', schemaVersion: 2 })
  })

  it('importa um backup válido depois de confirmar e recarrega', async () => {
    const user = userEvent.setup()
    useConfigStore.getState().replaceConfig({ ...CONFIG_SEED, targetCalories: 3500 })
    const json = await exportAll()
    useConfigStore.getState().replaceConfig(CONFIG_SEED)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SettingsScreen />)

    await user.upload(screen.getByLabelText(/importar backup/i), backupFile(json))

    await waitFor(() => expect(reloadApp).toHaveBeenCalledOnce())
    expect((await storedConfig()).targetCalories).toBe(3500)
  })

  it('não importa se o usuário cancelar a confirmação', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<SettingsScreen />)

    await user.upload(
      screen.getByLabelText(/importar backup/i),
      backupFile(JSON.stringify({ app: 'outro' })),
    )

    expect(reloadApp).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mostra o erro de backup inválido e não recarrega', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SettingsScreen />)

    await user.upload(
      screen.getByLabelText(/importar backup/i),
      backupFile(JSON.stringify({ app: 'outro' })),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esse arquivo não é um backup do Carga.',
    )
    expect(reloadApp).not.toHaveBeenCalled()
  })
})
