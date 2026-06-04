import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import HubButton from './components/HubButton'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HubButton />
    <App />
  </StrictMode>,
)
