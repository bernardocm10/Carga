import { describe, expect, it } from 'vitest'
import {
  exerciseIdForName,
  migrateConfigV1toV2,
  migrateSessionV1toV2,
  migrateV1toV2,
} from './migrateV1toV2'

const MAP = { 'Rosca martelo': 'Hammer_Curls', 'Leg press': 'Leg_Press' }

const CONFIG_V1 = {
  targetCalories: 3150,
  trainingSplit: [
    {
      weekday: 1,
      name: 'Push',
      focus: 'x',
      exercises: [
        { name: 'Rosca martelo', sets: 3, reps: '8-15' },
        { name: 'Exercício que o usuário digitou', sets: 2, reps: '8' },
      ],
    },
    { weekday: 0, name: 'Descanso', focus: '—', exercises: [] },
  ],
}

const SESSION_V1 = {
  date: '2026-09-02',
  dayName: 'Pernas',
  exercises: [{ name: 'Leg press', sets: [{ weight: 120, reps: 8 }] }],
}

describe('exerciseIdForName', () => {
  it('usa o mapa', () => {
    expect(exerciseIdForName('Leg press', MAP)).toBe('Leg_Press')
  })

  it('nome fora do mapa vira legacy:<nome>', () => {
    expect(exerciseIdForName('Supino reto', MAP)).toBe('legacy:Supino reto')
  })

  it('nome que coincide com propriedade de Object não vaza do protótipo', () => {
    expect(exerciseIdForName('constructor', MAP)).toBe('legacy:constructor')
  })
})

describe('migrateConfigV1toV2', () => {
  it('troca name por exerciseId e preserva o resto', () => {
    expect(migrateConfigV1toV2(CONFIG_V1, MAP)).toEqual({
      targetCalories: 3150,
      trainingSplit: [
        {
          weekday: 1,
          name: 'Push',
          focus: 'x',
          exercises: [
            { exerciseId: 'Hammer_Curls', sets: 3, reps: '8-15' },
            { exerciseId: 'legacy:Exercício que o usuário digitou', sets: 2, reps: '8' },
          ],
        },
        { weekday: 0, name: 'Descanso', focus: '—', exercises: [] },
      ],
    })
  })

  it('é idempotente', () => {
    const once = migrateConfigV1toV2(CONFIG_V1, MAP)
    expect(migrateConfigV1toV2(once, MAP)).toEqual(once)
  })

  it('não quebra com formato inesperado', () => {
    expect(migrateConfigV1toV2(null, MAP)).toBeNull()
    expect(migrateConfigV1toV2({ targetCalories: 1 }, MAP)).toEqual({ targetCalories: 1 })
    expect(migrateConfigV1toV2({ trainingSplit: ['x', { exercises: 'y' }] }, MAP)).toEqual({
      trainingSplit: ['x', { exercises: 'y' }],
    })
  })
})

describe('migrateSessionV1toV2', () => {
  it('troca name por exerciseId no histórico', () => {
    expect(migrateSessionV1toV2(SESSION_V1, MAP)).toEqual({
      date: '2026-09-02',
      dayName: 'Pernas',
      exercises: [{ exerciseId: 'Leg_Press', sets: [{ weight: 120, reps: 8 }] }],
    })
  })

  it('é idempotente', () => {
    const once = migrateSessionV1toV2(SESSION_V1, MAP)
    expect(migrateSessionV1toV2(once, MAP)).toEqual(once)
  })
})

describe('migrateV1toV2', () => {
  it('converte config e todas as sessões', () => {
    const out = migrateV1toV2({ config: CONFIG_V1, trainingLog: [SESSION_V1] }, MAP)
    expect(out.trainingLog).toEqual([migrateSessionV1toV2(SESSION_V1, MAP)])
    expect(out.config).toEqual(migrateConfigV1toV2(CONFIG_V1, MAP))
  })
})
