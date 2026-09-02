import type { TabModule } from '@/shared/ui/tab-module'
import { todayTab } from '@/modules/today'
import { weightTab } from '@/modules/weight'
import { trainingTab } from '@/modules/training'
import { settingsTab } from '@/modules/settings'
import { guideTab } from '@/modules/guide'

/** Registro de abas. Nova aba = importar o descriptor e adicionar aqui. */
export const TABS: TabModule[] = [todayTab, weightTab, trainingTab, settingsTab, guideTab]
