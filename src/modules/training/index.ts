import { Dumbbell } from 'lucide-react'
import type { TabModule } from '@/shared/ui/tab-module'
import { TrainingScreen } from './TrainingScreen'

export const trainingTab: TabModule = {
  id: 'training',
  label: 'Treino',
  icon: Dumbbell,
  Screen: TrainingScreen,
}
