import { describe, expect, it } from 'vitest'
import { CONFIG_SEED } from './seed'
import { trainingDayForDate, trainingDayForWeekday } from './config.selectors'

describe('trainingDayForWeekday', () => {
  it('acha o treino de segunda-feira', () => {
    expect(trainingDayForWeekday(CONFIG_SEED, 1)?.name).toBe('Push A')
  })

  it('domingo é Descanso', () => {
    expect(trainingDayForWeekday(CONFIG_SEED, 0)?.name).toBe('Descanso')
  })

  it('devolve undefined para um weekday fora da lista', () => {
    expect(trainingDayForWeekday({ ...CONFIG_SEED, trainingSplit: [] }, 3)).toBeUndefined()
  })
})

describe('trainingDayForDate', () => {
  it('mapeia a data pelo dia da semana', () => {
    const monday = new Date(2026, 7, 10) // 2026-08-10
    expect(trainingDayForDate(CONFIG_SEED, monday)?.name).toBe('Push A')
  })
})
