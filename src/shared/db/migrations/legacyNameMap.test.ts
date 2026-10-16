import { describe, expect, it } from 'vitest'
import { LEGACY_NAME_MAP } from './legacyNameMap'
import { exerciseIdForName } from './migrateV1toV2'

// copiado do backup real exportado em 2026-10-16 (ficha atual + histórico)
const NOMES_DO_BACKUP_REAL = [
  'Abdominal Infra',
  'Abdominal Supra',
  'Agachamento búlgaro',
  'Agachamento hack',
  'Barra fixa / puxada alta',
  'Cadeira extensora',
  'Crucifixo inverso',
  'Elevação de pernas na barra',
  'Elevação lateral na máquina',
  'Elevação lateral na polia',
  'Elevação pélvica',
  'Leg press',
  'Mesa flexora',
  'Mesa flexora sentado',
  'Panturrilha em pé',
  'Panturrilha sentado',
  'Puxada unilateral na polia',
  'Remada baixa ao quadril',
  'Remada com apoio no peito',
  'Rosca inclinada com halteres',
  'Rosca martelo',
  'Rosca scott',
  'Serrátil na polia',
  'Supino inclinado com halteres',
  'Supino inclinado máquina/Smith',
  'Terra romeno',
  'Tríceps corda',
  'Tríceps francês na polia',
]

describe('LEGACY_NAME_MAP', () => {
  it('cobre todos os nomes do backup real (nenhum vira legacy:)', () => {
    const unmapped = NOMES_DO_BACKUP_REAL.filter((name) =>
      exerciseIdForName(name).startsWith('legacy:'),
    )
    expect(unmapped).toEqual([])
  })

  it('mapeia exatamente os nomes do backup (sem sobras)', () => {
    expect(Object.keys(LEGACY_NAME_MAP).sort()).toEqual([...NOMES_DO_BACKUP_REAL].sort())
  })

  it('casos-chave do spec', () => {
    expect(LEGACY_NAME_MAP['Rosca martelo']).toBe('Hammer_Curls')
    expect(LEGACY_NAME_MAP['Crucifixo inverso']).toBe('cg:reverse-fly')
    expect(LEGACY_NAME_MAP['Barra fixa / puxada alta']).toBe('cg:pullup-lat-pulldown')
  })
})
