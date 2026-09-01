import { Scale } from 'lucide-react'
import type { TabModule } from '@/shared/ui/tab-module'
import { WeightScreen } from './WeightScreen'

export const weightTab: TabModule = {
  id: 'weight',
  label: 'Peso',
  icon: Scale,
  Screen: WeightScreen,
}
