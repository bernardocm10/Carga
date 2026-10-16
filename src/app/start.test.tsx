import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Root } from 'react-dom/client'
import { reloadApp } from '@/shared/lib/reloadApp'
import { start } from './start'

vi.mock('@/shared/lib/reloadApp', () => ({ reloadApp: vi.fn() }))

let root: Root | undefined

afterEach(() => {
  act(() => root?.unmount())
  root = undefined
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

async function startWith(boot: () => Promise<void>): Promise<void> {
  const container = document.body.appendChild(document.createElement('div'))
  await act(async () => {
    root = await start(container, boot)
  })
}

describe('start', () => {
  it('renderiza o app depois do bootstrap', async () => {
    await startWith(() => Promise.resolve())
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('bootstrap falhou: mostra o erro em vez do app editável', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await startWith(() => Promise.reject(new Error('Internal error opening backing store')))

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível abrir os dados')
    expect(screen.getByText(/Internal error opening backing store/)).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('tentar de novo recarrega o app', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await startWith(() => Promise.reject(new Error('quota')))

    await userEvent.click(screen.getByRole('button', { name: /tentar de novo/i }))

    expect(reloadApp).toHaveBeenCalledOnce()
  })
})
