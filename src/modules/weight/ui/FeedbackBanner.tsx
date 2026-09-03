import { cn } from '@/shared/lib/cn'
import { useConfig } from '@/entities/config'
import { useWeightLog } from '@/entities/weight-log'
import { evaluateWeightProtocol, type Verdict } from '../domain/weightProtocol'

const TONE: Record<Verdict['kind'], string> = {
  'insufficient-data': 'border-steel text-graphite-soft',
  'on-track': 'border-tatami text-graphite',
  'too-fast': 'border-rust text-graphite',
  'below-target': 'border-brass text-graphite',
}

export function FeedbackBanner() {
  const config = useConfig()
  const entries = useWeightLog()
  const verdict = evaluateWeightProtocol(entries, config)

  return (
    <div className={cn('border-l-4 py-1 pl-3 text-sm', TONE[verdict.kind])}>
      {messageFor(verdict)}
    </div>
  )
}

function messageFor(verdict: Verdict): string {
  switch (verdict.kind) {
    case 'insufficient-data':
      return 'Dados insuficientes nos últimos 14 dias. Siga registrando o peso todo dia.'
    case 'on-track':
      return `Ritmo dentro do esperado: ${grams(verdict.deltaG)}/semana (${percent(verdict.pct)}). Manter as calorias.`
    case 'too-fast':
      return `Ganho rápido demais: ${grams(verdict.deltaG)}/semana (${percent(verdict.pct)}). Sugestão: cortar calorias.`
    case 'below-target':
      return `Ganho abaixo da meta: ${grams(verdict.deltaG)}/semana (${percent(verdict.pct)}). Sugestão: subir calorias.`
  }
}

const grams = (value: number) => `${value > 0 ? '+' : ''}${value} g`
const percent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
