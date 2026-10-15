/** um conjunto de fotos de um exercício do acervo: [início, fim] */
export type ImageVariant = { sourceId: string; images: string[] }

export type CatalogExercise = {
  /** id do free-exercise-db (ex. "Hammer_Curls") ou "cg:<slug>" para os próprios */
  id: string
  /** nome em inglês */
  name: string
  primaryMuscles: string[]
  equipment: string | null
  /** ≥ 1 variante; a primeira é a padrão */
  variants: ImageVariant[]
}
