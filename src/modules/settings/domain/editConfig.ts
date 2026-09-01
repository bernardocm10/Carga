import type { Config, Exercise, Macros } from '@/entities/config'

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
