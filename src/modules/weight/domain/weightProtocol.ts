import { addDays } from '@/shared/date/week'
import type { Config } from '@/entities/config'
import type { WeightEntry } from '@/entities/weight-log'

export type Verdict =
  | { kind: 'insufficient-data' }
  | { kind: 'too-fast'; deltaG: number; pct: number }
  | { kind: 'below-target'; deltaG: number; pct: number }
  | { kind: 'on-track'; deltaG: number; pct: number }

const MIN_PER_BLOCK = 2

/**
 * Protocolo de ajuste (app_arquitetura_v1.md §2). Compara a média dos 7 dias até a
 * última entrada com a dos 7 anteriores. Cortar vence subir.
 */
export function evaluateWeightProtocol(entries: WeightEntry[], config: Config): Verdict {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const anchor = sorted.at(-1)?.date
  if (anchor === undefined) return { kind: 'insufficient-data' }

  const recentStart = addDays(anchor, -6)
  const prevEnd = addDays(recentStart, -1)
  const prevStart = addDays(prevEnd, -6)

  const recent = sorted.filter((e) => e.date >= recentStart && e.date <= anchor)
  const previous = sorted.filter((e) => e.date >= prevStart && e.date <= prevEnd)

  if (recent.length < MIN_PER_BLOCK || previous.length < MIN_PER_BLOCK) {
    return { kind: 'insufficient-data' }
  }

  const previousAvg = mean(previous)
  const deltaKg = mean(recent) - previousAvg
  const deltaG = Math.round(deltaKg * 1000)
  const pct = (deltaKg / previousAvg) * 100

  if (deltaG > config.weightGoalMaxG || pct > config.weightAlertPct) {
    return { kind: 'too-fast', deltaG, pct }
  }
  if (deltaG < config.weightGoalMinG) {
    return { kind: 'below-target', deltaG, pct }
  }
  return { kind: 'on-track', deltaG, pct }
}

function mean(entries: WeightEntry[]): number {
  return entries.reduce((sum, e) => sum + e.kg, 0) / entries.length
}
