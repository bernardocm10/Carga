import { db } from '@/shared/db'
import type { SupplementDay } from './supplement-log.types'

const table = () => db.table<SupplementDay, string>('supplementLog')

export function loadSupplementLog(): Promise<SupplementDay[]> {
  return table().orderBy('date').toArray()
}

export async function putSupplementDay(day: SupplementDay): Promise<void> {
  await table().put(day)
}

export async function deleteSupplementDay(date: string): Promise<void> {
  await table().delete(date)
}
