import { FeedbackBanner } from './ui/FeedbackBanner'
import { WeightChart } from './ui/WeightChart'
import { WeightForm } from './ui/WeightForm'

export function WeightScreen() {
  return (
    <section className="flex flex-col gap-4 p-4">
      <h1 className="font-display text-graphite text-3xl tracking-wide uppercase">Peso</h1>
      <FeedbackBanner />
      <WeightChart />
      <WeightForm />
    </section>
  )
}
