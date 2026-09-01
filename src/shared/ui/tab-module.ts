import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

/** Contrato de uma aba. Cada módulo em `src/modules/*` exporta um destes. */
export type TabModule = {
  /** id estável, usado como chave e no estado de navegação */
  id: string
  /** rótulo PT-BR mostrado na barra */
  label: string
  icon: LucideIcon
  Screen: ComponentType
}
