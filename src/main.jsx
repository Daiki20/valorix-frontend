import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

// First-touch UTM attribution: save on first visit, persist 30 days
;(function captureUTM() {
  const params = new URLSearchParams(window.location.search)
  const source = params.get('utm_source')
  const campaign = params.get('utm_campaign')
  if (source && !localStorage.getItem('valorix_utm_source')) {
    localStorage.setItem('valorix_utm_source', source)
    localStorage.setItem('valorix_utm_campaign', campaign || '')
    const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `valorix_utm_source=${source};expires=${exp};path=/`
    document.cookie = `valorix_utm_campaign=${campaign || ''};expires=${exp};path=/`
  }
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
