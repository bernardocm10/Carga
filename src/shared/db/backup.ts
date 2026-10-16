import { CONFIG_ROW_ID, DB_VERSION, db } from './db'
import { settled } from './persist'

type Dated = { date: string }

const LOG_TABLES = ['weightLog', 'trainingLog', 'supplementLog'] as const

export type BackupFile = {
  app: 'claudgym'
  schemaVersion: number
  exportedAt: string
  config: object
  weightLog: Dated[]
  trainingLog: Dated[]
  supplementLog: Dated[]
}

export class BackupError extends Error {
  override name = 'BackupError'
}

function isDatedList(value: unknown): value is Dated[] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) => typeof row === 'object' && row !== null && typeof (row as Dated).date === 'string',
    )
  )
}

function parseBackup(json: string): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new BackupError('O arquivo não é um JSON válido.')
  }
  const file = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<
    Record<keyof BackupFile, unknown>
  >
  if (file.app !== 'claudgym') throw new BackupError('Esse arquivo não é um backup do claudgym.')
  if (typeof file.schemaVersion !== 'number') {
    throw new BackupError('Esse arquivo não é um backup do claudgym.')
  }
  if (file.schemaVersion > DB_VERSION) {
    throw new BackupError(
      'Backup de uma versão mais nova do app — atualize o app antes de importar.',
    )
  }
  if (typeof file.config !== 'object' || file.config === null) {
    throw new BackupError('Backup incompleto: falta a config.')
  }
  for (const name of LOG_TABLES) {
    if (!isDatedList(file[name])) throw new BackupError(`Backup inválido: ${name}.`)
  }
  return file as BackupFile
}

/** Serializa todos os dados do usuário (sem o meta). Espera as escritas pendentes. */
export async function exportAll(now = new Date()): Promise<string> {
  await settled()
  const configRow = await db
    .table<{ id: string; config: object }, string>('config')
    .get(CONFIG_ROW_ID)
  const file: BackupFile = {
    app: 'claudgym',
    schemaVersion: DB_VERSION,
    exportedAt: now.toISOString(),
    config: configRow?.config ?? {},
    weightLog: await db.table<Dated, string>('weightLog').orderBy('date').toArray(),
    trainingLog: await db.table<Dated, string>('trainingLog').orderBy('date').toArray(),
    supplementLog: await db.table<Dated, string>('supplementLog').orderBy('date').toArray(),
  }
  return JSON.stringify(file, null, 2)
}

/** Valida o arquivo inteiro e só então substitui config + logs numa transação. */
export async function importAll(json: string): Promise<void> {
  const file = parseBackup(json)
  await settled()
  const tables = [db.table('config'), ...LOG_TABLES.map((name) => db.table(name))]
  await db.transaction('rw', tables, async () => {
    await db.table('config').put({ id: CONFIG_ROW_ID, config: file.config })
    for (const name of LOG_TABLES) {
      await db.table(name).clear()
      await db.table(name).bulkPut(file[name])
    }
  })
}
