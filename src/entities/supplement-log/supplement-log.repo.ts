import { kvGet, kvSet } from '@/shared/storage'
import type { SupplementDay } from './supplement-log.types'

const KEY = 'supplementLog'

function byDate(a: SupplementDay, b: SupplementDay): number {
  return a.date.localeCompare(b.date)
}

export function loadSupplementLog(): SupplementDay[] {
  return [...kvGet<SupplementDay[]>(KEY, [])].sort(byDate)
}

export function saveSupplementLog(days: SupplementDay[]): void {
  kvSet(KEY, [...days].sort(byDate))
}
