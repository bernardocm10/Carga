import { create } from 'zustand'
import { persist } from '@/shared/db'
import { loadImageChoices, putImageChoice } from './image-choice.repo'

type ImageChoiceState = {
  choices: Record<string, number>
  hydrate: () => Promise<void>
  select: (exerciseId: string, variantIndex: number) => void
}

export const useImageChoiceStore = create<ImageChoiceState>((set, get) => ({
  choices: {},
  hydrate: async () => {
    set({ choices: await loadImageChoices() })
  },
  select: (exerciseId, variantIndex) => {
    set({ choices: { ...get().choices, [exerciseId]: variantIndex } })
    persist(putImageChoice({ exerciseId, variantIndex }))
  },
}))

/** Variante de foto escolhida para o exercício (padrão 0) e como trocá-la. */
export function useImageChoice(exerciseId: string): {
  selected: number
  select: (index: number) => void
} {
  const selected = useImageChoiceStore((state) => state.choices[exerciseId] ?? 0)
  const select = useImageChoiceStore((state) => state.select)
  return { selected, select: (index) => select(exerciseId, index) }
}
