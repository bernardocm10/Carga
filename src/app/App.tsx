import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { TABS } from './tabs'

export function App() {
  const [activeId, setActiveId] = useState(TABS[0]?.id)
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0]

  if (!active) return null
  const { Screen } = active

  return (
    <div className="bg-concrete text-graphite flex min-h-dvh flex-col">
      <main className="flex-1 overflow-y-auto">
        <div key={active.id} className="cg-enter">
          <Screen />
        </div>
      </main>

      <nav className="border-hairline bg-chalk flex border-t">
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
                'font-display flex flex-1 flex-col items-center gap-1 py-2 text-xs tracking-wide uppercase',
                'transition-colors duration-150 active:scale-95',
                isActive ? 'text-iron' : 'text-graphite-soft hover:text-graphite',
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
