import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useWeightLogStore } from '@/entities/weight-log'
import { db, settled } from '@/shared/db'
import { WeightScreen } from './WeightScreen'

beforeEach(() => {
  useWeightLogStore.setState({ entries: [] })
})

describe('WeightScreen', () => {
  it('mostra o título e o banner de dados insuficientes sem histórico', () => {
    render(<WeightScreen />)
    expect(screen.getByRole('heading', { name: /peso/i })).toBeInTheDocument()
    expect(screen.getByText(/dados insuficientes/i)).toBeInTheDocument()
  })

  it('salva um registro de peso pelo formulário', async () => {
    const user = userEvent.setup()
    render(<WeightScreen />)

    await user.type(screen.getByLabelText(/peso \(kg\)/i), '80.5')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await settled()
    expect(await db.table('weightLog').toArray()).toEqual([expect.objectContaining({ kg: 80.5 })])
  })
})
