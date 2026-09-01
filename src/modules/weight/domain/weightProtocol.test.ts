import { describe, expect, it } from 'vitest'
import { CONFIG_SEED } from '@/entities/config'
import type { WeightEntry } from '@/entities/weight-log'
import { addDays } from '@/shared/date/week'
import { evaluateWeightProtocol } from './weightProtocol'

/**
 * Monta 2 blocos de 7 dias corridos ancorados em `anchor`.
 * `prevKg` e `recentKg` viram o valor de cada dia do bloco (média = o próprio valor).
 */
function buildEntries(
  anchor: string,
  prevKg: number,
  recentKg: number,
  perBlock = 4,
): WeightEntry[] {
  const recentStart = addDays(anchor, -6)
  const prevEnd = addDays(recentStart, -1)
  const entries: WeightEntry[] = []
  for (let i = 0; i < perBlock; i++) {
    entries.push({ date: addDays(anchor, -i), kg: recentKg })
    entries.push({ date: addDays(prevEnd, -i), kg: prevKg })
  }
  return entries
}

describe('evaluateWeightProtocol', () => {
  it('histórico vazio -> insufficient-data', () => {
    expect(evaluateWeightProtocol([], CONFIG_SEED)).toEqual({ kind: 'insufficient-data' })
  })

  it('menos de 2 registros num bloco -> insufficient-data', () => {
    const entries: WeightEntry[] = [
      { date: '2026-08-10', kg: 80 },
      { date: '2026-08-09', kg: 80 },
      { date: '2026-08-08', kg: 80 }, // tudo no bloco recente, bloco anterior vazio
    ]
    expect(evaluateWeightProtocol(entries, CONFIG_SEED)).toEqual({ kind: 'insufficient-data' })
  })

  it('ganho de 180 g/semana e 0,22% -> on-track', () => {
    const v = evaluateWeightProtocol(buildEntries('2026-08-20', 80.0, 80.18), CONFIG_SEED)
    expect(v.kind).toBe('on-track')
    if (v.kind === 'on-track') expect(v.deltaG).toBe(180)
  })

  it('ganho de 260 g/semana (> 220 g) -> too-fast mesmo com % baixo', () => {
    const v = evaluateWeightProtocol(buildEntries('2026-08-20', 80.0, 80.26), CONFIG_SEED)
    expect(v.kind).toBe('too-fast')
  })

  it('ganho > 0,5% do peso -> too-fast mesmo com gramas <= 220', () => {
    // prev 40 kg, +0.21 kg => 210 g (<=220) mas 0.525% (>0.5)
    const v = evaluateWeightProtocol(buildEntries('2026-08-20', 40.0, 40.21), CONFIG_SEED)
    expect(v.kind).toBe('too-fast')
  })

  it('ganho de 100 g/semana (< 150 g) -> below-target', () => {
    const v = evaluateWeightProtocol(buildEntries('2026-08-20', 80.0, 80.1), CONFIG_SEED)
    expect(v.kind).toBe('below-target')
  })

  it('perda de peso -> below-target com deltaG negativo', () => {
    const v = evaluateWeightProtocol(buildEntries('2026-08-20', 80.0, 79.7), CONFIG_SEED)
    expect(v.kind).toBe('below-target')
    if (v.kind === 'below-target') expect(v.deltaG).toBeLessThan(0)
  })

  it('exatamente 150 g -> on-track (limiar não é estrito pra baixo)', () => {
    const v = evaluateWeightProtocol(buildEntries('2026-08-20', 80.0, 80.15), CONFIG_SEED)
    expect(v.kind).toBe('on-track')
  })

  it('exatamente 220 g -> on-track (limiar de corte é estrito)', () => {
    const v = evaluateWeightProtocol(buildEntries('2026-08-20', 80.0, 80.22), CONFIG_SEED)
    expect(v.kind).toBe('on-track')
  })

  it('independe da ordem das entradas', () => {
    const ordered = buildEntries('2026-08-20', 80.0, 80.18)
    const shuffled = [...ordered].reverse()
    expect(evaluateWeightProtocol(shuffled, CONFIG_SEED)).toEqual(
      evaluateWeightProtocol(ordered, CONFIG_SEED),
    )
  })

  it('funciona atravessando a virada de mês', () => {
    const v = evaluateWeightProtocol(buildEntries('2026-03-03', 80.0, 80.18), CONFIG_SEED)
    expect(v.kind).toBe('on-track')
  })
})
