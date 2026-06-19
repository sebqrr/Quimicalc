import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css' 

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("No se encontró el elemento raíz '#root' en el index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)