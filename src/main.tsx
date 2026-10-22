import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

// G2-27: expone window.__seedHourLogs(count?) en modo dev para medir el baseline
if (import.meta.env.DEV) {
  import('./utils/seedDevData')
}


const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('No se encontró el elemento #root')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
