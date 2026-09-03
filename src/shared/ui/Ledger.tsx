import type { ReactNode } from 'react'

/**
 * Folha do livro-razão: régua vermelha na margem esquerda, conteúdo recuado.
 * As telas põem seções (`LedgerSection`) dentro.
 */
export function LedgerPage({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full">
      <div aria-hidden className="bg-brass/70 pointer-events-none absolute inset-y-0 left-5 w-px" />
      <div className="relative flex flex-col gap-6 py-4 pr-5 pl-9">{children}</div>
    </div>
  )
}

/** Bloco do razão: legenda em versalete sobre um fio, sem card. */
export function LedgerSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-graphite-soft border-hairline border-b pb-1.5 font-mono text-[10px] tracking-[0.14em] uppercase">
        {label}
      </h2>
      {children}
    </section>
  )
}
