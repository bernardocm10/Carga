import { describe, expect, it } from 'vitest'
import { addDays, mondayFirstIndex, toISODate, weekDates } from './week'

describe('toISODate', () => {
  it('formata com zero à esquerda', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('usa o dia local, não UTC', () => {
    expect(toISODate(new Date(2026, 11, 31, 23, 30))).toBe('2026-12-31')
  })
})

describe('addDays', () => {
  it('soma dias', () => {
    expect(addDays('2026-08-10', 6)).toBe('2026-08-16')
  })

  it('subtrai dias', () => {
    expect(addDays('2026-08-10', -7)).toBe('2026-08-03')
  })

  it('atravessa a virada de mês pra trás', () => {
    expect(addDays('2026-03-03', -7)).toBe('2026-02-24')
  })

  it('atravessa a virada de ano', () => {
    expect(addDays('2026-01-02', -5)).toBe('2025-12-28')
  })
})

describe('mondayFirstIndex', () => {
  it('segunda-feira é 0', () => {
    expect(mondayFirstIndex(new Date(2026, 7, 10))).toBe(0) // 2026-08-10 é segunda
  })

  it('domingo é 6', () => {
    expect(mondayFirstIndex(new Date(2026, 7, 9))).toBe(6) // 2026-08-09 é domingo
  })
})

describe('weekDates', () => {
  it('devolve 7 datas começando na segunda', () => {
    const week = weekDates(new Date(2026, 7, 13)) // quinta
    expect(week).toHaveLength(7)
    expect(week[0]).toBe('2026-08-10')
    expect(week[6]).toBe('2026-08-16')
  })

  it('atravessa a virada de mês', () => {
    const week = weekDates(new Date(2026, 8, 1)) // 2026-09-01 é terça
    expect(week[0]).toBe('2026-08-31')
    expect(week[6]).toBe('2026-09-06')
  })
})
