import { kvGet } from '@/shared/storage'
import { CONFIG_ROW_ID, db } from './db'

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

    const config = kvGet<unknown>('config', null)
    if (typeof config === 'object' && config !== null) {
      await db.table('config').put({ id: CONFIG_ROW_ID, config })
    }
    await db.table('weightLog').bulkPut(datedRows('weightLog'))
    await db.table('trainingLog').bulkPut(datedRows('trainingLog'))
    await db.table('supplementLog').bulkPut(datedRows('supplementLog'))
    await meta.put({ key: FLAG, value: now.toISOString() })
    return true
  })
}
