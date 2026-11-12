import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// Self-hosted (bundled into /assets): no render-blocking request to Google, and the fonts work offline.
import '@fontsource-variable/fredoka/wght.css'
import '@fontsource-variable/red-hat-text/wght.css'
import './index.css'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js') // prod only: no stale cache during dev
