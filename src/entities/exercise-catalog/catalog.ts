import raw from './data/catalog.json'
import { CUSTOM_DEFINITIONS } from './data/custom'
import type { CatalogExercise, ImageVariant } from './exercise-catalog.types'
import { searchIn } from './search'

const LEGACY_PREFIX = 'legacy:'

const ACERVO = raw as CatalogExercise[]
const acervoById = new Map(ACERVO.map((exercise) => [exercise.id, exercise]))

const CUSTOM: CatalogExercise[] = CUSTOM_DEFINITIONS.map((definition) => {
  const sources = definition.sources
    .map((id) => acervoById.get(id))
    .filter((source): source is CatalogExercise => source !== undefined)
  const variants: ImageVariant[] = sources.flatMap((source) => source.variants.slice(0, 1))
  return {
    id: definition.id,
    name: definition.name,
    primaryMuscles: sources[0]?.primaryMuscles ?? [],
    equipment: sources[0]?.equipment ?? null,
    variants,
  }
})

export const CATALOG: CatalogExercise[] = [...CUSTOM, ...ACERVO]

const byId = new Map(CATALOG.map((exercise) => [exercise.id, exercise]))

export function exerciseById(id: string): CatalogExercise | undefined {
  return byId.get(id)
}

export function exerciseName(id: string): string {
  const found = byId.get(id)
  if (found !== undefined) return found.name
  return id.startsWith(LEGACY_PREFIX) ? id.slice(LEGACY_PREFIX.length) : id
}

export function searchExercises(query: string, priorityIds: string[] = []): CatalogExercise[] {
  return searchIn(CATALOG, query, priorityIds)
}

export function imageUrl(path: string): string {
  return `${import.meta.env.BASE_URL}exercises/${path}`
}

export function exerciseImages(id: string): string[][] {
  return (byId.get(id)?.variants ?? []).map((variant) => variant.images.map(imageUrl))
}
