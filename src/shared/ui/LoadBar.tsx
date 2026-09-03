import { cn } from '@/shared/lib/cn'

export type PlateColor = 'iron' | 'brass' | 'tatami' | 'rust' | 'steel'

const FILL: Record<PlateColor, string> = {
  iron: 'text-iron',
  brass: 'text-brass',
  tatami: 'text-tatami',
  rust: 'text-rust',
  steel: 'text-steel',
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value))
}

type Segment = { color: PlateColor; pct: number }

type Props = {
  /** um preenchimento simples: fração 0–1 e a cor da anilha */
  value?: number
  color?: PlateColor
  /** ou vários blocos coloridos que somam a barra (macros) */
  segments?: Segment[]
  size?: 'sm' | 'lg'
  className?: string
}

/** Barra carregada de anilha — como toda quantidade aparece no app. */
export function LoadBar({ value, color = 'steel', segments, size = 'sm', className }: Props) {
  const parts: Segment[] = segments ?? [{ color, pct: clampPct((value ?? 0) * 100) }]

  return (
    <div
      className={cn(
        'bg-hairline flex overflow-hidden',
        size === 'lg' ? 'h-[18px]' : 'h-[14px]',
        className,
      )}
    >
      {parts.map((part, index) => (
        <span
          key={index}
          className={cn('cg-plate block h-full', FILL[part.color])}
          style={{ width: `${clampPct(part.pct)}%` }}
        />
      ))}
    </div>
  )
}
