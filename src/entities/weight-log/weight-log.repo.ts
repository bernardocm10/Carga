import { kvGet, kvSet } from '@/shared/storage'
import type { WeightEntry } from './weight-log.types'

const KEY = 'weightLog'

function byDate(a: WeightEntry, b: WeightEntry): number {
  return a.date.localeCompare(b.date)
}

export function loadWeightLog(): WeightEntry[] {
  return [...kvGet<WeightEntry[]>(KEY, [])].sort(byDate)
}

export function saveWeightLog(entries: WeightEntry[]): void {
  kvSet(KEY, [...entries].sort(byDate))
}
