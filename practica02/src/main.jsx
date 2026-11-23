import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Busca el contenedor raíz del HTML y monta la aplicación React.
createRoot(document.getElementById('root')).render(
  // StrictMode activa comprobaciones adicionales durante el desarrollo.
  <StrictMode>
    <App />
  </StrictMode>,
)
