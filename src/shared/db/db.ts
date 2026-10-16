import Dexie from 'dexie'

/** Versão do schema. Toda mudança de formato persistido sobe este número (ver doc 05). */
export const DB_VERSION = 1

export const CONFIG_ROW_ID = 'main'

export const db = new Dexie('claudgym')

db.version(DB_VERSION).stores({
  config: 'id',
  weightLog: 'date',
  trainingLog: 'date',
  supplementLog: 'date',
  meta: 'key',
})

/** Pede ao WebView que não despeje o banco sob pressão de espaço. Sem suporte → segue. */
export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // sem suporte ou negado: o backup manual cobre
  }
}
