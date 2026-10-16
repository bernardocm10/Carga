import { start } from '@/app/start'
import '@/shared/styles/tokens.css'

const container = document.getElementById('root')
if (!container) throw new Error('#root element not found')

void start(container)
