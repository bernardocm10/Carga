import { LEGACY_NAME_MAP } from './legacyNameMap'

type NameMap = Readonly<Record<string, string>>
type Json = Record<string, unknown>

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function exerciseIdForName(name: string, map: NameMap = LEGACY_NAME_MAP): string {
  return Object.hasOwn(map, name) ? (map[name] ?? `legacy:${name}`) : `legacy:${name}`
}

function migrateExercise(item: unknown, map: NameMap): unknown {
  if (!isRecord(item) || 'exerciseId' in item) return item
  const { name, ...rest } = item
  if (typeof name !== 'string') return item
  return { exerciseId: exerciseIdForName(name, map), ...rest }
}

function migrateExercises(list: unknown, map: NameMap): unknown {
  return Array.isArray(list) ? list.map((item: unknown) => migrateExercise(item, map)) : list
}

export function migrateConfigV1toV2(config: unknown, map: NameMap = LEGACY_NAME_MAP): unknown {
  if (!isRecord(config) || !Array.isArray(config.trainingSplit)) return config
  const trainingSplit = config.trainingSplit.map((day: unknown) =>
    isRecord(day) ? { ...day, exercises: migrateExercises(day.exercises, map) } : day,
  )
  return { ...config, trainingSplit }
}

export function migrateSessionV1toV2(session: unknown, map: NameMap = LEGACY_NAME_MAP): unknown {
  if (!isRecord(session)) return session
  return { ...session, exercises: migrateExercises(session.exercises, map) }
}

export function migrateV1toV2<C, S>(
  snapshot: { config: C; trainingLog: S[] },
  map: NameMap = LEGACY_NAME_MAP,
): { config: unknown; trainingLog: unknown[] } {
  return {
    config: migrateConfigV1toV2(snapshot.config, map),
    trainingLog: snapshot.trainingLog.map((session) => migrateSessionV1toV2(session, map)),
  }
}
