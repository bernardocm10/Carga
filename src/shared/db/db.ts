import Dexie from 'dexie'
import { migrateConfigV1toV2, migrateSessionV1toV2 } from './migrations/migrateV1toV2'

/** Versão do schema. Toda mudança de formato persistido sobe este número (ver doc 05). */
export const DB_VERSION = 2

export const CONFIG_ROW_ID = 'main'

export function defineSchema(target: Dexie): Dexie {
  target.version(1).stores({
    config: 'id',
    weightLog: 'date',
    trainingLog: 'date',
    supplementLog: 'date',
    meta: 'key',
  })

  target
    .version(2)
    .stores({ imageChoice: 'exerciseId' })
    .upgrade(async (tx) => {
      await tx
        .table('config')
        .toCollection()
        .modify((row: { config: unknown }) => {
          row.config = migrateConfigV1toV2(row.config)
        })
      await tx
        .table('trainingLog')
        .toCollection()
        .modify((row: { exercises?: unknown }) => {
          row.exercises = (migrateSessionV1toV2(row) as { exercises?: unknown }).exercises
        })
    })

  return target
}

export const db = defineSchema(new Dexie('claudgym'))

/** Pede ao WebView que não despeje o banco sob pressão de espaço. Sem suporte → segue. */
export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // sem suporte ou negado: o backup manual cobre
  }
}
