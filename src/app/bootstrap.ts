import { useConfigStore } from '@/entities/config'
import { importLegacyLocalStorage, requestPersistentStorage } from '@/shared/db'
import { applyTheme, loadTheme } from '@/shared/theme'

/** Roda uma vez antes do primeiro render: importa o legado e hidrata os stores. */
export async function bootstrap(): Promise<void> {
  // o script inline no index.html já cobriu o 1º paint; aqui reconcilia
  applyTheme(loadTheme())
  await importLegacyLocalStorage()
  // acessar o estado dispara loadConfig() -> semeia o storage se preciso
  useConfigStore.getState()
  void requestPersistentStorage()
}
