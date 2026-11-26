import { useRef, useState, type ChangeEvent } from 'react'
import { BackupError, exportAll, importAll } from '@/shared/db'
import { toISODate } from '@/shared/date/week'
import { readFileText } from '@/shared/lib/readFileText'
import { reloadApp } from '@/shared/lib/reloadApp'
import { shareTextFile } from '@/shared/lib/shareFile'
import { Button } from '@/shared/ui/Button'
import { Section } from '@/shared/ui/Page'

export function BackupSection() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const exportBackup = async () => {
    setError(null)
    try {
      await shareTextFile(`carga-backup-${toISODate(new Date())}.json`, await exportAll())
    } catch (cause) {
      console.error('[backup] export', cause)
      setError('Não foi possível exportar o backup.')
    }
  }

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file === undefined) return
    if (!window.confirm('Importar substitui todos os dados atuais pelos do backup. Continuar?')) {
      return
    }
    setError(null)
    try {
      await importAll(await readFileText(file))
      reloadApp()
    } catch (cause) {
      if (cause instanceof BackupError) {
        setError(cause.message)
        return
      }
      console.error('[backup] import', cause)
      setError('Não foi possível importar o backup.')
    }
  }

  return (
    <Section label="backup">
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => void exportBackup()}>
          Exportar backup
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => fileInput.current?.click()}>
          Importar backup
        </Button>
        <input
          ref={fileInput}
          type="file"
          aria-label="Importar backup"
          className="hidden"
          onChange={(event) => void importBackup(event)}
        />
      </div>
      {error !== null && (
        <p role="alert" className="text-rust mt-2 text-sm">
          {error}
        </p>
      )}
    </Section>
  )
}
