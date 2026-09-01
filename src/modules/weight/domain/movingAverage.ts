import { addDays } from '@/shared/date/week'
import type { WeightEntry } from '@/entities/weight-log'

export type AveragePoint = {
  date: string
  kg: number
  avg: number
}

/** Janela em dias corridos, não em número de registros: buracos entram com menos amostras. */
export function movingAverage(entries: WeightEntry[], windowDays = 7): AveragePoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((entry) => {
    const windowStart = addDays(entry.date, -(windowDays - 1))
    const inWindow = sorted.filter((e) => e.date >= windowStart && e.date <= entry.date)
    const avg = inWindow.reduce((sum, e) => sum + e.kg, 0) / inWindow.length
    return { date: entry.date, kg: entry.kg, avg }
  })
}
