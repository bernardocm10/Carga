import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONFIG_SEED, useConfigStore } from '@/entities/config'
import { useSupplementLogStore } from '@/entities/supplement-log'
import { useWeightLogStore } from '@/entities/weight-log'
import { toISODate } from '@/shared/date/week'
import { TodayScreen } from './TodayScreen'

const today = toISODate(new Date())

beforeEach(() => {
  localStorage.clear()
  useConfigStore.getState().replaceConfig(CONFIG_SEED)
  useWeightLogStore.setState({ entries: [] })
  useSupplementLogStore.setState({ days: [] })
})

describe('TodayScreen', () => {
  it('mostra as seções do dia', () => {
    render(<TodayScreen />)
    expect(screen.getByRole('heading', { name: /^semana$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^peso$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /meta do dia/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^suplementos$/i })).toBeInTheDocument()
  })

  it('marca um suplemento e persiste na data de hoje', async () => {
    const user = userEvent.setup()
    render(<TodayScreen />)

    await user.click(screen.getByRole('button', { name: /creatina/i }))

    const stored: unknown = JSON.parse(localStorage.getItem('cg:supplementLog') ?? '[]')
    expect(stored).toEqual([{ date: today, taken: ['Creatina'] }])
  })

  it('registra o peso de hoje pelo atalho', async () => {
    const user = userEvent.setup()
    render(<TodayScreen />)

    await user.type(screen.getByLabelText('kg'), '63,8')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    const stored: unknown = JSON.parse(localStorage.getItem('cg:weightLog') ?? '[]')
    expect(stored).toEqual([{ date: today, kg: 63.8 }])
    expect(screen.getByText('63,8')).toBeInTheDocument()
  })
})
