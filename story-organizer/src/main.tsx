import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

import { GoogleAuthProvider } from "./context/GoogleAuthContext";
// import "@fontsource/inter";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleAuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleAuthProvider>
  </StrictMode>
)
