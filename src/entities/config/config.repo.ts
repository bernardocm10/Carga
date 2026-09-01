import { kvGet, kvSet } from '@/shared/storage'
import { CONFIG_SEED } from './seed'
import type { Config } from './config.types'

const KEY = 'config'

/**
 * Carrega a Config. Na primeira vez (chave ausente) grava a semente e a devolve;
 * daí em diante devolve o que está salvo.
 */
export function loadConfig(): Config {
  const stored = kvGet<Config | null>(KEY, null)
  if (stored === null) {
    kvSet(KEY, CONFIG_SEED)
    return CONFIG_SEED
  }
  return stored
}

export function saveConfig(config: Config): void {
  kvSet(KEY, config)
}
