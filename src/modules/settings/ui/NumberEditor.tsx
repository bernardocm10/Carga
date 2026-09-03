import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { useSavedFlash } from '@/shared/lib/useSavedFlash'
import { NumberField } from '@/shared/ui/NumberField'

type Props = {
  label: string
  initial: number
  min: number
  onCommit: (value: number) => void
  className?: string
}

/** Campo numérico que confirma no blur e pisca ao salvar. */
export function NumberEditor({ label, initial, min, onCommit, className }: Props) {
  const [text, setText] = useState(String(initial))
  const [saved, flash] = useSavedFlash()

  const commit = () => {
    const value = Math.round(Number(text.replace(',', '.')))
    if (!Number.isFinite(value) || value < min) {
      setText(String(initial))
      return
    }
    if (value !== initial) {
      onCommit(value)
      flash()
    }
  }

  return (
    <NumberField
      label={label}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      className={cn(saved && 'cg-saved', className)}
    />
  )
}
