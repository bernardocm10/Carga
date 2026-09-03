import { useConfig, useConfigStore } from '@/entities/config'
import { Button } from '@/shared/ui/Button'
import { Section } from '@/shared/ui/Page'
import { addMicroNote, removeMicroNote, setMicroNote } from '../domain/editConfig'
import { InlineText } from './InlineText'

export function MicroNotesSection() {
  const config = useConfig()
  const updateConfig = useConfigStore((state) => state.updateConfig)

  return (
    <Section label="micronutrientes">
      <div className="flex flex-col gap-2">
        {config.micronotes.map((note, index) => (
          <div
            key={`${index}:${note.topic}`}
            className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2"
          >
            <InlineText
              ariaLabel={`Tópico ${index + 1}`}
              value={note.topic}
              onCommit={(value) =>
                value && updateConfig(setMicroNote(config, index, { topic: value }))
              }
            />
            <InlineText
              ariaLabel={`Detalhe ${index + 1}`}
              value={note.detail}
              placeholder="detalhe"
              onCommit={(value) => updateConfig(setMicroNote(config, index, { detail: value }))}
            />
            <button
              type="button"
              aria-label="Remover nota"
              onClick={() => updateConfig(removeMicroNote(config, index))}
              className="text-graphite-soft hover:text-rust p-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        onClick={() => updateConfig(addMicroNote(config))}
        className="mt-3 self-start px-3 text-xs"
      >
        + nota
      </Button>
    </Section>
  )
}
