/** Dia da semana no padrão JS: 0 = domingo ... 6 = sábado. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Data local no formato ISO `YYYY-MM-DD` (sem componente de fuso). */
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Soma `days` (pode ser negativo) a uma data ISO `YYYY-MM-DD`, devolvendo ISO. */
export function addDays(iso: string, days: number): string {
  const parts = iso.split('-')
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) + days)
  return toISODate(date)
}

/** Índice da semana começando na segunda: segunda = 0 ... domingo = 6. */
export function mondayFirstIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

/** As 7 datas ISO da semana que contém `date`, de segunda a domingo. */
export function weekDates(date: Date): string[] {
  const monday = new Date(date)
  monday.setDate(date.getDate() - mondayFirstIndex(date))
  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + offset)
    return toISODate(day)
  })
}
