import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrap } from '@/app/bootstrap'
import { App } from '@/app/App'
import '@/shared/styles/tokens.css'

bootstrap()

const root = document.getElementById('root')
if (!root) throw new Error('#root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
