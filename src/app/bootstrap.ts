import { useConfigStore } from '@/entities/config'
import { useSupplementLogStore } from '@/entities/supplement-log'
import { useTrainingLogStore } from '@/entities/training-log'
import { useWeightLogStore } from '@/entities/weight-log'
import { importLegacyLocalStorage, requestPersistentStorage } from '@/shared/db'
import { applyTheme, loadTheme } from '@/shared/theme'

/** Roda uma vez antes do primeiro render: importa o legado e hidrata os stores. */
export async function bootstrap(): Promise<void> {
  // o script inline no index.html já cobriu o 1º paint; aqui reconcilia
  applyTheme(loadTheme())
  await importLegacyLocalStorage()
  await Promise.all([
    useConfigStore.getState().hydrate(),
    useWeightLogStore.getState().hydrate(),
    useSupplementLogStore.getState().hydrate(),
    useTrainingLogStore.getState().hydrate(),
  ])
  void requestPersistentStorage()
}
