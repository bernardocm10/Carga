import { useConfig } from '@/entities/config'
import { LedgerSection } from '@/shared/ui/Ledger'

export function TodayTargets() {
  const config = useConfig()

  return (
    <LedgerSection label="Meta do dia">
      <div className="flex items-baseline justify-between font-mono">
        <span className="text-iron text-lg">{config.targetCalories} kcal</span>
        <span className="text-graphite-soft text-[11px]">
          {config.macros.protein}P · {config.macros.carbs}C · {config.macros.fat}G
        </span>
      </div>
    </LedgerSection>
  )
}
