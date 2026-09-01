import { useState } from 'react'

/**
 * Adia `remove` por `delayMs`, marcando o item como saindo — dá tempo da
 * animação de saída rodar sem precisar de lib de transição.
 */
export function useLeave(
  remove: () => void,
  delayMs = 140,
): { leaving: boolean; leave: () => void } {
  const [leaving, setLeaving] = useState(false)
  const leave = () => {
    if (leaving) return
    setLeaving(true)
    window.setTimeout(remove, delayMs)
  }
  return { leaving, leave }
}
