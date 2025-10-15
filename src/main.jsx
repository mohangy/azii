import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
// Leaflet styles for react-leaflet maps
import 'leaflet/dist/leaflet.css'
import { useStore } from './store/useStore'

// Bootstrap / entry point
// - Wraps the app with React Router and renders the main App component.
// - Reads theme from the global store and applies `dark` class on the documentElement.
// - Keep this file minimal: UI logic should live in components/pages, not here.
import { useEffect } from 'react'

function Root(){
  const theme = useStore(state => state.theme)
  // synchronize theme -> document element class. Keep effect minimal and idempotent.
  useEffect(()=>{
    if(theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  },[theme])
  return <App />
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
)
