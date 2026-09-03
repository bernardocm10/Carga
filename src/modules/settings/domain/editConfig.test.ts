import { describe, expect, it } from 'vitest'
import { CONFIG_SEED } from '@/entities/config'
import {
  addExercise,
  addMeal,
  addMealItem,
  addMicroNote,
  moveExercise,
  moveMeal,
  removeExercise,
  removeMeal,
  removeMealItem,
  removeMicroNote,
  setCalories,
  setExercise,
  setMacro,
  setMeal,
  setMealItem,
  setMealMacro,
  setMicroNote,
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

describe('refeições', () => {
  it('addMeal acrescenta uma refeição vazia no fim', () => {
    const out = addMeal(CONFIG_SEED)
    expect(out.meals).toHaveLength(CONFIG_SEED.meals.length + 1)
    expect(out.meals.at(-1)).toEqual({
      name: 'Nova refeição',
      when: '',
      kcal: 0,
      macros: { protein: 0, carbs: 0, fat: 0 },
      items: [],
    })
  })

  it('setMeal troca campos simples sem tocar em macros/items', () => {
    const out = setMeal(CONFIG_SEED, 0, { name: 'Brunch', kcal: 620 })
    expect(out.meals[0]?.name).toBe('Brunch')
    expect(out.meals[0]?.kcal).toBe(620)
    expect(out.meals[0]?.macros).toEqual(CONFIG_SEED.meals[0]?.macros)
    expect(out.meals[1]).toEqual(CONFIG_SEED.meals[1])
  })

  it('setMealMacro troca um macro de uma refeição só', () => {
    const out = setMealMacro(CONFIG_SEED, 1, 'protein', 70)
    expect(out.meals[1]?.macros.protein).toBe(70)
    expect(out.meals[0]?.macros).toEqual(CONFIG_SEED.meals[0]?.macros)
  })

  it('removeMeal tira pelo índice', () => {
    const out = removeMeal(CONFIG_SEED, 0)
    expect(out.meals).toHaveLength(CONFIG_SEED.meals.length - 1)
    expect(out.meals[0]).toEqual(CONFIG_SEED.meals[1])
  })

  it('moveMeal troca vizinhos e é no-op nos limites', () => {
    const names = (c: typeof CONFIG_SEED) => c.meals.map((m) => m.name)
    const swapped = moveMeal(CONFIG_SEED, 0, 1)
    expect(names(swapped).slice(0, 2)).toEqual([
      CONFIG_SEED.meals[1]?.name,
      CONFIG_SEED.meals[0]?.name,
    ])
    expect(names(moveMeal(CONFIG_SEED, 0, -1))).toEqual(names(CONFIG_SEED))
  })

  it('itens: add / set / remove numa refeição', () => {
    let out = addMealItem(CONFIG_SEED, 0, '1 laranja')
    expect(out.meals[0]?.items.at(-1)).toBe('1 laranja')
    const last = (out.meals[0]?.items.length ?? 1) - 1
    out = setMealItem(out, 0, last, '2 laranjas')
    expect(out.meals[0]?.items.at(-1)).toBe('2 laranjas')
    out = removeMealItem(out, 0, last)
    expect(out.meals[0]?.items).toEqual(CONFIG_SEED.meals[0]?.items)
  })
})

describe('micronutrientes', () => {
  it('add / set / remove', () => {
    let out = addMicroNote(CONFIG_SEED)
    expect(out.micronotes.at(-1)).toEqual({ topic: 'Novo', detail: '' })
    const last = out.micronotes.length - 1
    out = setMicroNote(out, last, { topic: 'Zinco', detail: '15 mg/dia' })
    expect(out.micronotes.at(-1)).toEqual({ topic: 'Zinco', detail: '15 mg/dia' })
    out = removeMicroNote(out, last)
    expect(out.micronotes).toEqual(CONFIG_SEED.micronotes)
  })
})
