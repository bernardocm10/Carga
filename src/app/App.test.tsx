import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('renderiza a aba Hoje na barra de navegação', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /hoje/i })).toBeInTheDocument()
  })

  it('mostra a meta de calorias da semente', () => {
    render(<App />)
    expect(screen.getByText(/3150 kcal/)).toBeInTheDocument()
  })
})
