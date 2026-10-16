import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchPicker } from './SearchPicker'

type Item = { id: string; label: string }

function setup(
  items: Item[] = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
  ],
) {
  const onQuery = vi.fn()
  const onPick = vi.fn()
  const onClose = vi.fn()
  render(
    <SearchPicker<Item>
      title="Escolher"
      items={items}
      emptyText="Nada por aqui."
      getKey={(item) => item.id}
      renderItem={(item) => <span>{item.label}</span>}
      onQuery={onQuery}
      onPick={onPick}
      onClose={onClose}
    />,
  )
  return { onQuery, onPick, onClose }
}

describe('SearchPicker', () => {
  it('lista os itens e entrega o escolhido', async () => {
    const { onPick } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Beta' }))
    expect(onPick).toHaveBeenCalledWith({ id: 'b', label: 'Beta' })
  })

  it('avisa a busca a cada digitação', async () => {
    const { onQuery } = setup()
    await userEvent.type(screen.getByLabelText('Buscar'), 'al')
    expect(onQuery).toHaveBeenLastCalledWith('al')
  })

  it('mostra o texto de vazio sem itens', () => {
    setup([])
    expect(screen.getByText('Nada por aqui.')).toBeInTheDocument()
  })

  it('fecha pelo botão', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByRole('button', { name: /fechar/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
