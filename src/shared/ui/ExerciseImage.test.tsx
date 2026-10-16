import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseImage } from './ExerciseImage'

const A = ['/exercises/A/0.webp', '/exercises/A/1.webp']
const B = ['/exercises/B/0.webp', '/exercises/B/1.webp']
const C = ['/exercises/C/0.webp', '/exercises/C/1.webp']

function pointer(element: Element, type: 'pointerdown' | 'pointerup', clientX: number) {
  fireEvent(element, new MouseEvent(type, { bubbles: true, clientX }))
}

function setup(variants: string[][], selected = 0) {
  const onSelect = vi.fn()
  const view = render(
    <ExerciseImage
      variants={variants}
      selected={selected}
      onSelect={onSelect}
      alt="Hammer Curls"
    />,
  )
  const thumb = screen.queryByRole('button', { name: /ampliar/i })
  return { onSelect, thumb, container: view.container }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ExerciseImage · miniatura', () => {
  it('mostra a foto de início da variante selecionada', () => {
    const { container } = setup([A, B], 1)
    expect(container.querySelector('img')).toHaveAttribute('src', B[0])
  })

  it('com 2+ variantes, indica qual está selecionada', () => {
    setup([A, B, C], 1)
    expect(screen.getByText('Foto 2 de 3')).toBeInTheDocument()
  })

  it('com uma variante só, não mostra indicador', () => {
    setup([A])
    expect(screen.queryByText(/Foto \d+ de/)).not.toBeInTheDocument()
  })

  it('sem variantes, mostra o ícone neutro e nenhum botão', () => {
    const { container, thumb } = setup([])
    expect(thumb).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('índice fora do intervalo cai na última variante', () => {
    const { container } = setup([A, B], 5)
    expect(container.querySelector('img')).toHaveAttribute('src', B[0])
  })
})

describe('ExerciseImage · arrastar', () => {
  it('arrastar para a esquerda além do limiar vai para a próxima', () => {
    const { onSelect, thumb } = setup([A, B, C], 0)
    pointer(thumb!, 'pointerdown', 200)
    pointer(thumb!, 'pointerup', 140)
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('arrastar para a direita volta (com volta ao fim)', () => {
    const { onSelect, thumb } = setup([A, B, C], 0)
    pointer(thumb!, 'pointerdown', 100)
    pointer(thumb!, 'pointerup', 160)
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('arrasto curto não troca de variante', () => {
    const { onSelect, thumb } = setup([A, B], 0)
    pointer(thumb!, 'pointerdown', 200)
    pointer(thumb!, 'pointerup', 180)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('com uma variante só, arrastar não faz nada', () => {
    const { onSelect, thumb } = setup([A])
    pointer(thumb!, 'pointerdown', 200)
    pointer(thumb!, 'pointerup', 100)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('depois de arrastar, o clique do fim do gesto não abre a vista ampliada', () => {
    const { thumb } = setup([A, B], 0)
    pointer(thumb!, 'pointerdown', 200)
    pointer(thumb!, 'pointerup', 120)
    fireEvent.click(thumb!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('ExerciseImage · vista ampliada', () => {
  it('toque abre e alterna início/fim a cada ~1 s; fechar remove', () => {
    vi.useFakeTimers()
    const { thumb } = setup([A])
    fireEvent.click(thumb!)

    const dialog = screen.getByRole('dialog', { name: 'Hammer Curls' })
    const image = () => dialog.querySelector('img')
    expect(image()).toHaveAttribute('src', A[0])

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(image()).toHaveAttribute('src', A[1])

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(image()).toHaveAttribute('src', A[0])

    fireEvent.click(screen.getByRole('button', { name: /fechar/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('arrastar na vista ampliada também troca de variante', async () => {
    const { onSelect, thumb } = setup([A, B], 0)
    await userEvent.click(thumb!)
    const image = screen.getByRole('dialog').querySelector('img')!
    pointer(image, 'pointerdown', 220)
    pointer(image, 'pointerup', 150)
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})
