import { THEMES, useTheme, useThemeStore } from '@/shared/theme'
import { cn } from '@/shared/lib/cn'
import { Section } from '@/shared/ui/Page'

export function AppearanceSection() {
  const theme = useTheme()
  const setTheme = useThemeStore((state) => state.setTheme)

  return (
    <Section label="aparência">
      <div className="flex gap-1.5">
        {THEMES.map(({ id, label }) => {
          const isActive = id === theme
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setTheme(id)}
              className={cn(
                'font-display flex-1 border-2 py-2 text-xs font-bold tracking-wide uppercase',
                'transition-colors duration-150 active:scale-[0.97]',
                isActive
                  ? 'border-iron bg-iron text-white'
                  : 'border-hairline text-graphite-soft hover:text-graphite',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </Section>
  )
}
