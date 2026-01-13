'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, CircleDot, Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/issues/new', icon: Plus, label: 'New', isAction: true },
  { href: '/issues', icon: CircleDot, label: 'Issues' },
  { href: '/time', icon: Clock, label: 'Time' },
]

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  if (href === '/issues/new') return pathname === '/issues/new'
  return pathname === href || pathname.startsWith(href + '/')
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = isActiveRoute(pathname, item.href)
          const Icon = item.icon
          
          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="flex items-center justify-center size-12 rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Icon className="size-6" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
