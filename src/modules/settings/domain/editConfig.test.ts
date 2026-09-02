import { describe, expect, it } from 'vitest'
import { CONFIG_SEED } from '@/entities/config'
import {
  addExercise,
  moveExercise,
  removeExercise,
  setCalories,
  setExercise,
  setMacro,
} from './editConfig'

const day = 1

/** Seed com todos os dias zerados — os testes de exercício partem do vazio. */
const EMPTY = {
  ...CONFIG_SEED,
  trainingSplit: CONFIG_SEED.trainingSplit.map((d) => ({ ...d, exercises: [] })),
}

function exercisesOf(config: typeof CONFIG_SEED, weekday: number) {
  return config.trainingSplit.find((d) => d.weekday === weekday)?.exercises ?? []
}

describe('setCalories', () => {
  it('troca o alvo sem tocar no resto', () => {
    const out = setCalories(CONFIG_SEED, 3300)
    expect(out.targetCalories).toBe(3300)
    expect(out.macros).toEqual(CONFIG_SEED.macros)
  })
})

describe('setMacro', () => {
  it('troca um macro e preserva os outros', () => {
    const out = setMacro(CONFIG_SEED, 'protein', 180)
    expect(out.macros).toEqual({ ...CONFIG_SEED.macros, protein: 180 })
  })

  it('não muta o config original', () => {
    setMacro(CONFIG_SEED, 'carbs', 400)
    expect(CONFIG_SEED.macros.carbs).toBe(425)
  })
})

describe('addExercise', () => {
  it('adiciona no fim do dia certo', () => {
    const out = addExercise(EMPTY, day, { name: 'Supino reto', sets: 4, reps: '4-6' })
    expect(exercisesOf(out, day)).toEqual([{ name: 'Supino reto', sets: 4, reps: '4-6' }])
    expect(exercisesOf(out, 2)).toEqual([])
  })
})

describe('setExercise', () => {
  it('aplica um patch raso no exercício do índice', () => {
    const base = addExercise(EMPTY, day, { name: 'Supino', sets: 3, reps: '8-10' })
    const out = setExercise(base, day, 0, { sets: 5 })
    expect(exercisesOf(out, day)[0]).toEqual({ name: 'Supino', sets: 5, reps: '8-10' })
  })

  it('índice fora do range é no-op', () => {
    const out = setExercise(EMPTY, day, 3, { sets: 5 })
    expect(exercisesOf(out, day)).toEqual([])
  })
})

describe('removeExercise', () => {
  it('remove pelo índice', () => {
    let base = addExercise(EMPTY, day, { name: 'A', sets: 3, reps: '8' })
    base = addExercise(base, day, { name: 'B', sets: 3, reps: '8' })
    const out = removeExercise(base, day, 0)
    expect(exercisesOf(out, day).map((e) => e.name)).toEqual(['B'])
  })
})

describe('moveExercise', () => {
  it('troca com o vizinho na direção', () => {
    let base = addExercise(EMPTY, day, { name: 'A', sets: 3, reps: '8' })
    base = addExercise(base, day, { name: 'B', sets: 3, reps: '8' })
    base = addExercise(base, day, { name: 'C', sets: 3, reps: '8' })
    expect(exercisesOf(moveExercise(base, day, 0, 1), day).map((e) => e.name)).toEqual([
      'B',
      'A',
      'C',
    ])
    expect(exercisesOf(moveExercise(base, day, 2, -1), day).map((e) => e.name)).toEqual([
      'A',
      'C',
      'B',
    ])
  })

  it('nos limites é no-op', () => {
    const base = addExercise(EMPTY, day, { name: 'A', sets: 3, reps: '8' })
    expect(exercisesOf(moveExercise(base, day, 0, -1), day).map((e) => e.name)).toEqual(['A'])
    expect(exercisesOf(moveExercise(base, day, 0, 1), day).map((e) => e.name)).toEqual(['A'])
  })
})
