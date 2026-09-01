import { describe, expect, it } from 'vitest'
import { movingAverage } from './movingAverage'

describe('movingAverage', () => {
  it('lista vazia -> resultado vazio', () => {
    expect(movingAverage([])).toEqual([])
  })

  it('um ponto: a média é o próprio ponto', () => {
    expect(movingAverage([{ date: '2026-08-10', kg: 80 }])).toEqual([
      { date: '2026-08-10', kg: 80, avg: 80 },
    ])
  })

  it('média das entradas dentro da janela de 7 dias corridos', () => {
    const out = movingAverage([
      { date: '2026-08-01', kg: 80.0 },
      { date: '2026-08-04', kg: 80.6 },
      { date: '2026-08-08', kg: 81.0 }, // janela [08-02 .. 08-08] -> só 08-04 e 08-08
    ])
    expect(out[2]).toEqual({ date: '2026-08-08', kg: 81.0, avg: (80.6 + 81.0) / 2 })
  })

  it('ordena entradas fora de ordem antes de calcular', () => {
    const out = movingAverage([
      { date: '2026-08-08', kg: 81 },
      { date: '2026-08-01', kg: 80 },
    ])
    expect(out.map((p) => p.date)).toEqual(['2026-08-01', '2026-08-08'])
  })

  it('respeita janela custom', () => {
    const out = movingAverage(
      [
        { date: '2026-08-01', kg: 80 },
        { date: '2026-08-02', kg: 82 },
      ],
      1,
    )
    expect(out[1]).toEqual({ date: '2026-08-02', kg: 82, avg: 82 })
  })
})
