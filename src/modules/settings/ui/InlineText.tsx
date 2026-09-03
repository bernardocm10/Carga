import { cn } from '@/shared/lib/cn'

type Props = {
  value: string
  onCommit: (value: string) => void
  placeholder?: string
  ariaLabel: string
  className?: string
}

/** Input de texto que confirma no blur; remonta se o valor mudar por fora. */
export function InlineText({ value, onCommit, placeholder, ariaLabel, className }: Props) {
  return (
    <input
      key={value}
      aria-label={ariaLabel}
      defaultValue={value}
      placeholder={placeholder}
      onBlur={(event) => {
        const next = event.target.value.trim()
        if (next !== value) onCommit(next)
      }}
      className={cn(
        'border-hairline bg-chalk text-graphite focus:border-iron w-full min-w-0 border px-3 py-2 text-sm',
        'placeholder:text-graphite-soft focus:outline-none',
        className,
      )}
    />
  )
}
