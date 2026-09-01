const PREFIX = 'cg:'

/**
 * Lê uma chave do localStorage e faz parse. Qualquer falha — chave ausente,
 * JSON inválido, storage indisponível — devolve `fallback` sem lançar.
 */
export function kvGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Grava uma chave no localStorage. Falha (quota, indisponível) é engolida. */
export function kvSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // segue a vida — o app continua funcionando a partir do estado em memória
  }
}

/** Remove uma chave do localStorage. */
export function kvRemove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // noop
  }
}
