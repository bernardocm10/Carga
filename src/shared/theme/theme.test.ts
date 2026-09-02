import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, loadTheme, saveTheme } from './theme'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('loadTheme', () => {
  it('cai no claro sem nada salvo', () => {
    expect(loadTheme()).toBe('light')
  })

  it('lê o tema salvo', () => {
    saveTheme('dark')
    expect(loadTheme()).toBe('dark')
  })

  it('cai no claro com valor inválido', () => {
    localStorage.setItem('cg:theme', '"neon"')
    expect(loadTheme()).toBe('light')
  })
})

describe('applyTheme', () => {
  it('marca o data-theme fora do claro', () => {
    applyTheme('dim')
    expect(document.documentElement.dataset.theme).toBe('dim')
  })

  it('remove o atributo no claro', () => {
    applyTheme('dark')
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})
