import type { ReactNode } from 'react'

/** Coluna única da tela — esquerda, sem card. As telas põem `Section` dentro. */
export function Page({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-7 px-5 py-4">{children}</div>
}

/** Bloco da tela: rótulo discreto e o conteúdo. */
export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-graphite-soft font-body text-[13px] font-semibold">{label}</h2>
      {children}
    </section>
  )
}
