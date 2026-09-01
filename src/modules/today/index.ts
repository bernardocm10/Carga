import { CalendarDays } from 'lucide-react'
import type { TabModule } from '@/shared/ui/tab-module'
import { TodayScreen } from './TodayScreen'

export const todayTab: TabModule = {
  id: 'today',
  label: 'Hoje',
  icon: CalendarDays,
  Screen: TodayScreen,
}
