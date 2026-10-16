import { useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

type Props<T> = {
  title: string
  items: T[]
  emptyText: string
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  onQuery: (query: string) => void
  onPick: (item: T) => void
  onClose: () => void
}

export function SearchPicker<T>({
  title,
  items,
  emptyText,
  getKey,
  renderItem,
  onQuery,
  onPick,
  onClose,
}: Props<T>) {
  const [query, setQuery] = useState('')
  const titleId = useId()

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="bg-concrete text-graphite fixed inset-0 z-50 flex flex-col gap-3 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="font-display text-2xl font-black uppercase">
          {title}
        </h2>
        <Button variant="ghost" onClick={onClose} className="px-3 text-xs">
          Fechar
        </Button>
      </div>

      <input
        type="search"
        aria-label="Buscar"
        autoFocus
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          onQuery(event.target.value)
        }}
        className="border-hairline bg-chalk text-graphite focus:border-iron w-full rounded border px-3 py-2 text-base focus:outline-none"
      />

      {items.length === 0 ? (
        <p className="text-graphite-soft text-sm">{emptyText}</p>
      ) : (
        <ul className="divide-hairline border-hairline min-h-0 flex-1 divide-y overflow-y-auto border-t">
          {items.map((item) => (
            <li key={getKey(item)}>
              <button
                type="button"
                onClick={() => onPick(item)}
                className="hover:bg-chalk w-full py-3 text-left"
              >
                {renderItem(item)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body,
  )
}
