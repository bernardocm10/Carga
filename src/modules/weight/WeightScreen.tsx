import { Page, Section } from '@/shared/ui/Page'
import { FeedbackBanner } from './ui/FeedbackBanner'
import { WeightChart } from './ui/WeightChart'
import { WeightForm } from './ui/WeightForm'

export function WeightScreen() {
  return (
    <Page>
      <h1 className="font-display text-graphite text-4xl leading-none font-black uppercase">
        Peso
      </h1>
      <FeedbackBanner />
      <Section label="evolução">
        <WeightChart />
      </Section>
      <Section label="registrar">
        <WeightForm />
      </Section>
    </Page>
  )
}
