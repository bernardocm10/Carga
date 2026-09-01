import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
}

export function NumberField({ label, id, className, ...rest }: Props) {
  const inputId = id ?? `nf-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <label htmlFor={inputId} className="flex flex-col gap-1">
      <span className="font-display text-graphite-soft text-xs tracking-wide uppercase">
        {label}
      </span>
      <input
        id={inputId}
        inputMode="decimal"
        className={cn(
          'border-hairline bg-chalk text-graphite rounded border px-3 py-2 font-mono text-lg',
          'focus:border-iron focus:outline-none',
          className,
        )}
        {...rest}
      />
    </label>
  )
}
