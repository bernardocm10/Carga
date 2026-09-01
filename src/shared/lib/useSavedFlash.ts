import { useCallback, useState } from 'react'

/** Pulso booleano curto pra sinalizar "gravou" num campo. */
export function useSavedFlash(durationMs = 600): readonly [boolean, () => void] {
  const [on, setOn] = useState(false)
  const flash = useCallback(() => {
    setOn(true)
    window.setTimeout(() => setOn(false), durationMs)
  }, [durationMs])
  return [on, flash]
}
