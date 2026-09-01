import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { TABS } from './tabs'

export function App() {
  const [activeId, setActiveId] = useState(TABS[0]?.id)
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0]

  if (!active) return null
  const { Screen } = active

  return (
    <div className="flex min-h-dvh flex-col bg-concrete text-graphite">
      <main className="flex-1 overflow-y-auto">
        <Screen />
      </main>

      <nav className="flex border-t border-hairline bg-chalk">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === active.id
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setActiveId(tab.id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 font-display text-xs uppercase tracking-wide',
                isActive ? 'text-iron' : 'text-graphite-soft',
              )}
            >
              <Icon size={20} aria-hidden />
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
