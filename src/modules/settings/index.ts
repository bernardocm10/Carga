import { Settings } from 'lucide-react'
import type { TabModule } from '@/shared/ui/tab-module'
import { SettingsScreen } from './SettingsScreen'

export const settingsTab: TabModule = {
  id: 'settings',
  label: 'Ajustes',
  icon: Settings,
  Screen: SettingsScreen,
}
