import { kvGet, kvSet } from '@/shared/storage'

export type Theme = 'light' | 'dim' | 'dark'

export const THEMES: Array<{ id: Theme; label: string }> = [
  { id: 'light', label: 'Claro' },
  { id: 'dim', label: 'Penumbra' },
  { id: 'dark', label: 'Escuro' },
]

const KEY = 'theme'
const DEFAULT: Theme = 'light'

export function loadTheme(): Theme {
  const raw = kvGet<Theme>(KEY, DEFAULT)
  return THEMES.some((theme) => theme.id === raw) ? raw : DEFAULT
}

export function saveTheme(theme: Theme): void {
  kvSet(KEY, theme)
}

/** Reflete o tema no `<html data-theme>`. `light` não recebe atributo (é o padrão). */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'light') delete root.dataset.theme
  else root.dataset.theme = theme
}
