'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Bell, Moon, Sun, LogOut } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { Breadcrumbs } from './breadcrumbs'
import { logout } from '@/app/actions/auth'

// Use useSyncExternalStore for SSR-safe DOM access
function useIsDarkMode() {
  return useSyncExternalStore(
    (callback) => {
      // Subscribe to class changes on documentElement
      const observer = new MutationObserver(callback)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
      return () => observer.disconnect()
    },
    () => document.documentElement.classList.contains('dark'),
    () => false // Server snapshot
  )
}

export function DashboardHeader() {
  const isDark = useIsDarkMode()

  const toggleTheme = () => {
    const newIsDark = !isDark
    document.documentElement.classList.toggle('dark', newIsDark)
    try {
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
    } catch {
      // localStorage not available
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumb / Page title */}
      <div className="flex items-center gap-2 overflow-hidden">
        <Breadcrumbs />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {/* Notification dot */}
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        
        <form action={logout}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            type="submit"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  )
}
