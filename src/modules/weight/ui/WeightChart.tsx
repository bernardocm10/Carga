import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useWeightLog } from '@/entities/weight-log'
import { movingAverage } from '../domain/movingAverage'

export function WeightChart() {
  const entries = useWeightLog()

  if (entries.length < 2) {
    return (
      <p className="border-hairline bg-chalk font-body text-graphite-soft rounded border p-4 text-sm">
        Registre ao menos 2 dias pra ver a evolução.
      </p>
    )
  }

  const data = movingAverage(entries)

  return (
    <div className="border-hairline bg-chalk h-56 rounded border p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(value: string) => value.slice(5)}
          />
          <YAxis
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            tick={{ fontSize: 10 }}
            width={44}
            tickFormatter={(value: number) => value.toFixed(1)}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="kg"
            stroke="var(--color-hairline)"
            strokeWidth={1}
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="var(--color-iron)"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
