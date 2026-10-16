import { CONFIG_ROW_ID, db } from '@/shared/db'
import { CONFIG_SEED } from './seed'
import type { Config } from './config.types'

type ConfigRow = { id: string; config: Config }

const table = () => db.table<ConfigRow, string>('config')

/** Na primeira vez (sem linha salva) grava a semente e a devolve; daí em diante, o que está salvo. */
export async function loadConfig(): Promise<Config> {
  const row = await table().get(CONFIG_ROW_ID)
  if (row !== undefined) return row.config
  await table().put({ id: CONFIG_ROW_ID, config: CONFIG_SEED })
  return CONFIG_SEED
}

export async function saveConfig(config: Config): Promise<void> {
  await table().put({ id: CONFIG_ROW_ID, config })
}
