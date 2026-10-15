import { useConfigStore } from '@/entities/config'
import { requestPersistentStorage } from '@/shared/db'
import { applyTheme, loadTheme } from '@/shared/theme'

/** Roda uma vez antes do primeiro render. */
export function bootstrap(): void {
  // acessar o estado dispara loadConfig() -> semeia o storage se preciso
  useConfigStore.getState()
  // o script inline no index.html já cobriu o 1º paint; aqui reconcilia
  applyTheme(loadTheme())
  void requestPersistentStorage()
}
