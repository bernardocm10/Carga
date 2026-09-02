import { THEMES, useTheme, useThemeStore } from '@/shared/theme'
import { cn } from '@/shared/lib/cn'

export function AppearanceSection() {
  const theme = useTheme()
  const setTheme = useThemeStore((state) => state.setTheme)

  return (
    <div className="border-hairline bg-chalk flex flex-col gap-3 rounded border p-4">
      <h2 className="font-display text-graphite text-lg tracking-wide uppercase">Aparência</h2>
      <div className="flex gap-1">
        {THEMES.map(({ id, label }) => {
          const isActive = id === theme
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setTheme(id)}
              className={cn(
                'font-display flex-1 rounded border py-2 text-xs tracking-wide uppercase',
                'transition-colors duration-150 active:scale-[0.97]',
                isActive
                  ? 'border-iron bg-iron text-chalk'
                  : 'border-hairline bg-chalk text-graphite-soft hover:text-graphite',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
