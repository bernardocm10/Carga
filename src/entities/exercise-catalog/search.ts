import type { CatalogExercise } from './exercise-catalog.types'

const LIMIT = 50

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function searchIn(
  list: CatalogExercise[],
  query: string,
  priorityIds: string[] = [],
): CatalogExercise[] {
  const needle = normalize(query)
  const matches = list.filter((exercise) => normalize(exercise.name).includes(needle))
  const priority = new Set(priorityIds)
  return [
    ...matches.filter((exercise) => priority.has(exercise.id)),
    ...matches.filter((exercise) => !priority.has(exercise.id)),
  ].slice(0, LIMIT)
}
