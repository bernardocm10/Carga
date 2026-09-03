import type { Config, Exercise, Macros, Meal, MicroNote } from '@/entities/config'

function mapDay(
  config: Config,
  weekday: number,
  fn: (exercises: Exercise[]) => Exercise[],
): Config {
  return {
    ...config,
    trainingSplit: config.trainingSplit.map((day) =>
      day.weekday === weekday ? { ...day, exercises: fn(day.exercises) } : day,
    ),
  }
}

export function setCalories(config: Config, value: number): Config {
  return { ...config, targetCalories: value }
}

export function setMacro(config: Config, key: keyof Macros, value: number): Config {
  return { ...config, macros: { ...config.macros, [key]: value } }
}

export function addExercise(config: Config, weekday: number, exercise: Exercise): Config {
  return mapDay(config, weekday, (exercises) => [...exercises, exercise])
}

export function setExercise(
  config: Config,
  weekday: number,
  index: number,
  patch: Partial<Exercise>,
): Config {
  return mapDay(config, weekday, (exercises) =>
    exercises.map((exercise, i) => (i === index ? { ...exercise, ...patch } : exercise)),
  )
}

export function removeExercise(config: Config, weekday: number, index: number): Config {
  return mapDay(config, weekday, (exercises) => exercises.filter((_, i) => i !== index))
}

export function moveExercise(
  config: Config,
  weekday: number,
  index: number,
  direction: -1 | 1,
): Config {
  return mapDay(config, weekday, (exercises) => {
    const target = index + direction
    if (target < 0 || target >= exercises.length) return exercises
    const next = [...exercises]
    const moved = next[index]
    const swapped = next[target]
    if (moved === undefined || swapped === undefined) return exercises
    next[index] = swapped
    next[target] = moved
    return next
  })
}

// --- dieta: refeições ---

function mapMeal(config: Config, index: number, fn: (meal: Meal) => Meal): Config {
  return { ...config, meals: config.meals.map((meal, i) => (i === index ? fn(meal) : meal)) }
}

export function addMeal(config: Config): Config {
  const meal: Meal = {
    name: 'Nova refeição',
    when: '',
    kcal: 0,
    macros: { protein: 0, carbs: 0, fat: 0 },
    items: [],
  }
  return { ...config, meals: [...config.meals, meal] }
}

export function setMeal(
  config: Config,
  index: number,
  patch: Partial<Pick<Meal, 'name' | 'when' | 'kcal' | 'note'>>,
): Config {
  return mapMeal(config, index, (meal) => ({ ...meal, ...patch }))
}

export function setMealMacro(
  config: Config,
  index: number,
  key: keyof Macros,
  value: number,
): Config {
  return mapMeal(config, index, (meal) => ({
    ...meal,
    macros: { ...meal.macros, [key]: value },
  }))
}

export function removeMeal(config: Config, index: number): Config {
  return { ...config, meals: config.meals.filter((_, i) => i !== index) }
}

export function moveMeal(config: Config, index: number, direction: -1 | 1): Config {
  const target = index + direction
  if (target < 0 || target >= config.meals.length) return config
  const next = [...config.meals]
  const moved = next[index]
  const swapped = next[target]
  if (moved === undefined || swapped === undefined) return config
  next[index] = swapped
  next[target] = moved
  return { ...config, meals: next }
}

export function addMealItem(config: Config, mealIndex: number, text: string): Config {
  return mapMeal(config, mealIndex, (meal) => ({ ...meal, items: [...meal.items, text] }))
}

export function setMealItem(
  config: Config,
  mealIndex: number,
  itemIndex: number,
  text: string,
): Config {
  return mapMeal(config, mealIndex, (meal) => ({
    ...meal,
    items: meal.items.map((item, i) => (i === itemIndex ? text : item)),
  }))
}

export function removeMealItem(config: Config, mealIndex: number, itemIndex: number): Config {
  return mapMeal(config, mealIndex, (meal) => ({
    ...meal,
    items: meal.items.filter((_, i) => i !== itemIndex),
  }))
}

// --- dieta: micronutrientes ---

export function addMicroNote(config: Config): Config {
  const note: MicroNote = { topic: 'Novo', detail: '' }
  return { ...config, micronotes: [...config.micronotes, note] }
}

export function setMicroNote(config: Config, index: number, patch: Partial<MicroNote>): Config {
  return {
    ...config,
    micronotes: config.micronotes.map((note, i) => (i === index ? { ...note, ...patch } : note)),
  }
}

export function removeMicroNote(config: Config, index: number): Config {
  return { ...config, micronotes: config.micronotes.filter((_, i) => i !== index) }
}
