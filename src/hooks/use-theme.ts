'use client'

import { useSyncExternalStore } from 'react'

function getThemeSnapshot(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function getServerSnapshot(): 'light' | 'dark' {
  return 'light'
}

function subscribeToTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

/**
 * Hook to get the current theme from the DOM.
 * Reacts to changes when the `.dark` class is toggled on `<html>`.
 */
export function useTheme(): 'light' | 'dark' {
  return useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot)
}
