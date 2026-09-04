import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import type { Theme } from './theme'

/**
 * Alinha a moldura nativa (barra de status) ao tema do app.
 * As barras ficam transparentes pelo `styles.xml`; aqui só ajustamos a cor dos
 * ícones. No-op fora do device.
 */
export function syncNativeChrome(theme: Theme): void {
  if (!Capacitor.isNativePlatform()) return
  // Dark = ícones claros (fundo escuro); Light = ícones escuros (fundo claro)
  const style = theme === 'light' ? Style.Light : Style.Dark
  void StatusBar.setStyle({ style }).catch(() => {})
}
