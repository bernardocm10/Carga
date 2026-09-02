import { BookOpen } from 'lucide-react'
import type { TabModule } from '@/shared/ui/tab-module'
import { GuideScreen } from './GuideScreen'

export const guideTab: TabModule = {
  id: 'guide',
  label: 'Guia',
  icon: BookOpen,
  Screen: GuideScreen,
}
