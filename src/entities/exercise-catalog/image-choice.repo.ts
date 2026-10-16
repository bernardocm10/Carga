import { db } from '@/shared/db'

type ImageChoiceRow = { exerciseId: string; variantIndex: number }

const table = () => db.table<ImageChoiceRow, string>('imageChoice')

export async function loadImageChoices(): Promise<Record<string, number>> {
  const rows = await table().toArray()
  return Object.fromEntries(rows.map((row) => [row.exerciseId, row.variantIndex]))
}

export async function putImageChoice(row: ImageChoiceRow): Promise<void> {
  await table().put(row)
}
