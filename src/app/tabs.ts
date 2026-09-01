import type { TabModule } from '@/shared/ui/tab-module'
import { todayTab } from '@/modules/today'

/** Registro de abas. Nova aba = importar o descriptor e adicionar aqui. */
export const TABS: TabModule[] = [todayTab]
