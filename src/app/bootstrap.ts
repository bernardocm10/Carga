/**
 * Roda uma vez antes do primeiro render.
 *
 * Hoje só força a leitura da Config (que grava a semente no 1º launch).
 * As migrations de schema (ver docs/padroes/05-dados-e-storage) entram aqui
 * quando o primeiro formato persistido mudar.
 */
import { useConfigStore } from '@/entities/config'
import { applyTheme, loadTheme } from '@/shared/theme'

export function bootstrap(): void {
  // acessar o estado dispara loadConfig() -> semeia o storage se preciso
  useConfigStore.getState()
  // o script inline no index.html já cobriu o 1º paint; aqui reconcilia
  applyTheme(loadTheme())
}
