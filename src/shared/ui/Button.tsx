import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

const VARIANT: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-iron text-chalk hover:brightness-110 active:brightness-95',
  ghost:
    'border-hairline text-graphite-soft border border-dashed hover:border-graphite-soft hover:text-graphite',
}

export function Button({ variant = 'primary', className, type, ...rest }: Props) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'font-display rounded px-4 py-2 text-sm tracking-wide uppercase',
        'transition-[filter,color,border-color,transform] duration-150',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:outline-iron focus-visible:outline-2 focus-visible:outline-offset-2',
        VARIANT[variant],
        className,
      )}
      {...rest}
    />
  )
}
