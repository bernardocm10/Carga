import { reloadApp } from '@/shared/lib/reloadApp'
import { Button } from '@/shared/ui/Button'

export function BootError({ error }: { error: unknown }) {
  return (
    <div className="bg-concrete text-graphite flex h-dvh flex-col justify-center gap-4 px-6">
      <p role="alert" className="text-rust text-lg font-semibold">
        Não foi possível abrir os dados
      </p>
      <p className="text-graphite-soft text-sm">
        Nada foi apagado. Feche e abra o app de novo; se continuar, exporte um backup assim que
        abrir.
      </p>
      <pre className="text-graphite-soft text-xs whitespace-pre-wrap">{String(error)}</pre>
      <Button onClick={reloadApp}>Tentar de novo</Button>
    </div>
  )
}
