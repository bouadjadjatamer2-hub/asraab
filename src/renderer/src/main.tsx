import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { installLocale } from './i18n'
import { useAppStore } from './store/useAppStore'

installLocale()

// Theme is an explicit attribute rather than only `prefers-color-scheme`: Electron on Windows
// does not reliably re-evaluate that media query when nativeTheme.themeSource changes, so the
// toggle would leave the window light until the next launch. Syncing the store to the root
// element keeps the first paint and every later toggle on the same value.
function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}
applyTheme(window.plexo.initialState.themeSource)
useAppStore.subscribe((state, previous) => {
  if (state.themeSource !== previous.themeSource) applyTheme(state.themeSource)
})

// Keep the window light on weak machines: no entrance animations, no looping signal unless the
// user has explicitly asked for motion. A slow device usually has four cores or less, or reports
// a small memory budget; either is enough to switch the decorative layer off.
const nav = navigator as Navigator & { deviceMemory?: number }
const lowPower =
  !window.matchMedia('(prefers-reduced-motion: no-preference)').matches ||
  (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
  (navigator.hardwareConcurrency || 8) <= 4
if (lowPower) document.documentElement.classList.add('reduce-motion')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
