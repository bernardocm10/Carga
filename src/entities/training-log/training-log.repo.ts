import { kvGet, kvSet } from '@/shared/storage'
import type { TrainingSession } from './training-log.types'

const KEY = 'trainingLog'

function byDate(a: TrainingSession, b: TrainingSession): number {
  return a.date.localeCompare(b.date)
}

export function loadTrainingLog(): TrainingSession[] {
  return [...kvGet<TrainingSession[]>(KEY, [])].sort(byDate)
}

export function saveTrainingLog(sessions: TrainingSession[]): void {
  kvSet(KEY, [...sessions].sort(byDate))
}
