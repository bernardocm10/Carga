const pending = new Set<Promise<void>>()

/** Dispara uma escrita sem bloquear a UI. Falha vai pro console; o estado em memória segue valendo. */
export function persist(write: Promise<unknown>): void {
  const tracked: Promise<void> = write
    .then(() => undefined)
    .catch((error: unknown) => {
      console.error('[db] escrita falhou', error)
    })
    .finally(() => {
      pending.delete(tracked)
    })
  pending.add(tracked)
}

/** Resolve quando todas as escritas disparadas até agora terminarem. */
export async function settled(): Promise<void> {
  while (pending.size > 0) await Promise.all([...pending])
}
