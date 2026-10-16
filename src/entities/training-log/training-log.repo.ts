import { db } from '@/shared/db'
import type { TrainingSession } from './training-log.types'

const table = () => db.table<TrainingSession, string>('trainingLog')

export function loadTrainingLog(): Promise<TrainingSession[]> {
  return table().orderBy('date').toArray()
}

export async function putSession(session: TrainingSession): Promise<void> {
  await table().put(session)
}

export async function deleteSession(date: string): Promise<void> {
  await table().delete(date)
}
