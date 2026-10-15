import { CONFIG_ROW_ID, DB_VERSION, db } from './db'
import { migrateV1toV2 } from './migrations/migrateV1toV2'
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

type Row = Record<string, unknown>

function isRecord(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Formato mínimo que as telas leem sem quebrar; o resto do conteúdo é do usuário. */
function isConfig(value: unknown): boolean {
  return (
    isRecord(value) &&
    ['targetCalories', 'weightGoalMinG', 'weightGoalMaxG', 'weightAlertPct'].every(
      (key) => typeof value[key] === 'number',
    ) &&
    isRecord(value.macros) &&
    ['supplements', 'trainingSplit', 'meals', 'micronotes'].every((key) =>
      Array.isArray(value[key]),
    )
  )
}

const ROW_SHAPE: Record<(typeof LOG_TABLES)[number], (row: Row) => boolean> = {
  weightLog: (row) => typeof row.kg === 'number',
  trainingLog: (row) => typeof row.dayName === 'string' && Array.isArray(row.exercises),
  supplementLog: (row) => Array.isArray(row.taken),
}

function isLog(name: (typeof LOG_TABLES)[number], value: unknown): value is Dated[] {
  return (
    Array.isArray(value) &&
    value.every((row) => isRecord(row) && typeof row.date === 'string' && ROW_SHAPE[name](row))
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
  if (file.config === undefined || file.config === null) {
    throw new BackupError('Backup incompleto: falta a config.')
  }
  if (!isConfig(file.config)) throw new BackupError('Backup inválido: config.')
  for (const name of LOG_TABLES) {
    if (!isLog(name, file[name])) throw new BackupError(`Backup inválido: ${name}.`)
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
  const snapshot = { config: file.config, trainingLog: file.trainingLog }
  const migrated = file.schemaVersion < 2 ? migrateV1toV2(snapshot) : snapshot
  const rows: Record<(typeof LOG_TABLES)[number], unknown[]> = {
    weightLog: file.weightLog,
    trainingLog: migrated.trainingLog,
    supplementLog: file.supplementLog,
  }
  const tables = [db.table('config'), ...LOG_TABLES.map((name) => db.table(name))]
  await db.transaction('rw', tables, async () => {
    await db.table('config').put({ id: CONFIG_ROW_ID, config: migrated.config })
    for (const name of LOG_TABLES) {
      await db.table(name).clear()
      await db.table(name).bulkPut(rows[name])
    }
  })
}
