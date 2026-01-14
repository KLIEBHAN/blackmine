'use client'

import { useEffect } from 'react'

export function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (isDark: boolean) => {
      document.documentElement.classList.toggle('dark', isDark)
    }

    let stored: string | null = null
    let preference: string | null = null
    try {
      stored = localStorage.getItem('theme')
      preference = localStorage.getItem('themePreference')
    } catch {
      // localStorage not available
    }

    const useStored = preference === 'manual' && (stored === 'dark' || stored === 'light')
    if (!useStored) {
      try {
        localStorage.setItem('themePreference', 'system')
        localStorage.removeItem('theme')
      } catch {
        // localStorage not available
      }
    }

    applyTheme(useStored ? stored === 'dark' : media.matches)

    if (useStored) {
      return
    }

    const handleChange = (event: MediaQueryListEvent) => {
      applyTheme(event.matches)
    }

    if (media.addEventListener) {
      media.addEventListener('change', handleChange)
      return () => media.removeEventListener('change', handleChange)
    }

    media.addListener(handleChange)
    return () => media.removeListener(handleChange)
  }, [])

  return null
}
