import { kvGet } from '@/shared/storage'
import { CONFIG_ROW_ID, db } from './db'
import { migrateV1toV2 } from './migrations/migrateV1toV2'

const FLAG = 'importedFromLocalStorage'

type Dated = { date: string }

function isDated(row: unknown): row is Dated {
  return typeof row === 'object' && row !== null && typeof (row as Dated).date === 'string'
}

function datedRows(key: string): Dated[] {
  const raw = kvGet<unknown>(key, [])
  return Array.isArray(raw) ? raw.filter(isDated) : []
}

/**
 * Copia os dados do localStorage pro banco, uma única vez por instalação.
 * As chaves cg:* ficam intactas como rede de segurança.
 */
export async function importLegacyLocalStorage(now = new Date()): Promise<boolean> {
  const meta = db.table<{ key: string; value: string }, string>('meta')
  return db.transaction('rw', db.tables, async () => {
    if ((await meta.get(FLAG)) !== undefined) return false

    const migrated = migrateV1toV2({
      config: kvGet<unknown>('config', null),
      trainingLog: datedRows('trainingLog'),
    })
    if (typeof migrated.config === 'object' && migrated.config !== null) {
      await db.table('config').put({ id: CONFIG_ROW_ID, config: migrated.config })
    }
    await db.table('weightLog').bulkPut(datedRows('weightLog'))
    await db.table('trainingLog').bulkPut(migrated.trainingLog)
    await db.table('supplementLog').bulkPut(datedRows('supplementLog'))
    await meta.put({ key: FLAG, value: now.toISOString() })
    return true
  })
}
