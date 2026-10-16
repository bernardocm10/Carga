import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Dumbbell } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const SWIPE_PX = 40
const FLIP_MS = 1000

type Props = {
  /** variants[i] = [url do início, url do fim] */
  variants: string[][]
  selected: number
  onSelect: (index: number) => void
  alt: string
  className?: string
}

function useSwipe(onSwipe: (direction: -1 | 1) => void) {
  const startX = useRef<number | null>(null)
  const swiped = useRef(false)
  return {
    /** true se o gesto que acabou foi um arrasto; zera ao ler (o clique do fim do gesto é ignorado) */
    consumeSwipe: () => {
      const was = swiped.current
      swiped.current = false
      return was
    },
    handlers: {
      onPointerDown: (event: PointerEvent) => {
        startX.current = event.clientX
        swiped.current = false
      },
      onPointerUp: (event: PointerEvent) => {
        if (startX.current === null) return
        const delta = event.clientX - startX.current
        startX.current = null
        if (Math.abs(delta) < SWIPE_PX) return
        swiped.current = true
        onSwipe(delta < 0 ? 1 : -1)
      },
      onPointerCancel: () => {
        startX.current = null
      },
    },
  }
}

type ViewerProps = {
  images: string[]
  alt: string
  onClose: () => void
  swipeHandlers: ReturnType<typeof useSwipe>['handlers'] | undefined
}

function Viewer({ images, alt, onClose, swipeHandlers }: ViewerProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setFrame((current) => (current + 1) % images.length), FLIP_MS)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-5"
    >
      <img
        src={images[frame]}
        alt=""
        draggable={false}
        className="max-h-[70dvh] w-full max-w-md touch-pan-y bg-white object-contain"
        {...swipeHandlers}
      />
      <button
        type="button"
        onClick={onClose}
        className="border-hairline bg-chalk text-graphite border px-4 py-2 text-sm font-semibold"
      >
        Fechar
      </button>
    </div>
  )
}

export function ExerciseImage({ variants, selected, onSelect, alt, className }: Props) {
  const [open, setOpen] = useState(false)
  const count = variants.length
  const index = Math.min(Math.max(selected, 0), count - 1)
  const swipe = useSwipe((direction) => onSelect((index + direction + count) % count))

  if (count === 0) {
    return (
      <div
        aria-hidden
        className={cn(
          'bg-chalk text-steel border-hairline flex size-16 shrink-0 items-center justify-center border',
          className,
        )}
      >
        <Dumbbell className="size-6" />
      </div>
    )
  }

  const images = variants[index] ?? []
  const handlers = count > 1 ? swipe.handlers : undefined

  return (
    <div className={cn('flex shrink-0 flex-col items-center gap-1', className)}>
      <button
        type="button"
        aria-label={`Ampliar foto de ${alt}`}
        onClick={() => {
          if (!swipe.consumeSwipe()) setOpen(true)
        }}
        className="border-hairline block size-16 touch-pan-y overflow-hidden border bg-white"
        {...handlers}
      >
        <img src={images[0]} alt="" draggable={false} className="size-full object-cover" />
      </button>

      {count > 1 && (
        <>
          <span className="sr-only">
            Foto {index + 1} de {count}
          </span>
          <span aria-hidden className="flex gap-1">
            {variants.map((_, position) => (
              <i
                key={position}
                className={cn(
                  'size-1.5 rounded-full',
                  position === index ? 'bg-graphite' : 'bg-steel',
                )}
              />
            ))}
          </span>
        </>
      )}

      {open && (
        <Viewer
          key={index}
          images={images}
          alt={alt}
          swipeHandlers={handlers}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
