import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { App } from './App'
import { BootError } from './BootError'
import { bootstrap } from './bootstrap'

/** Só monta o app editável com os stores hidratados; se o boot falhar, mostra o erro. */
export async function start(container: HTMLElement, boot = bootstrap): Promise<Root> {
  const root = createRoot(container)
  try {
    await boot()
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error('[bootstrap]', error)
    root.render(<BootError error={error} />)
  }
  return root
}
