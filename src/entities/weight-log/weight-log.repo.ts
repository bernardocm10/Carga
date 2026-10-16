import { db } from '@/shared/db'
import type { WeightEntry } from './weight-log.types'

const table = () => db.table<WeightEntry, string>('weightLog')

export function loadWeightLog(): Promise<WeightEntry[]> {
  return table().orderBy('date').toArray()
}

export async function putWeightEntry(entry: WeightEntry): Promise<void> {
  await table().put(entry)
}

export async function deleteWeightEntry(date: string): Promise<void> {
  await table().delete(date)
}
