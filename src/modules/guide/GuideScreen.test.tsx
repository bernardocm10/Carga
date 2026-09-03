import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CONFIG_SEED, useConfigStore } from '@/entities/config'
import { GuideScreen } from './GuideScreen'

beforeEach(() => {
  localStorage.clear()
  useConfigStore.getState().replaceConfig(CONFIG_SEED)
})

describe('GuideScreen', () => {
  it('mostra as metas e as seções do plano', () => {
    render(<GuideScreen />)

    expect(screen.getByRole('heading', { name: 'Guia' })).toBeInTheDocument()
    expect(screen.getByText('3150')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /cardápio/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /micronutrientes/i })).toBeInTheDocument()
  })

  it('lista uma refeição, uma regra de troca e uma nota de micronutriente do seed', () => {
    render(<GuideScreen />)

    expect(screen.getByRole('heading', { name: /café da manhã/i })).toBeInTheDocument()
    expect(screen.getByText(/bata a proteína/i)).toBeInTheDocument()
    expect(screen.getByText('Fibra')).toBeInTheDocument()
    expect(screen.getByText(/citrulina malato/i)).toBeInTheDocument()
  })

  it('não quebra se a config salva ainda não tiver meals/micronotes', () => {
    useConfigStore.getState().replaceConfig({
      ...CONFIG_SEED,
      meals: undefined as never,
      micronotes: undefined as never,
    })

    render(<GuideScreen />)

    expect(screen.getByRole('heading', { name: /cardápio/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /café da manhã/i })).not.toBeInTheDocument()
  })
})
