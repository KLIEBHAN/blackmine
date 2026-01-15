'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn, formatShortId } from '@/lib/utils'

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return <span className="text-sm font-semibold">Dashboard</span>
  }

  // On mobile, only show Home + last segment to save space
  const showOnMobile = (index: number) => index === segments.length - 1

  return (
    <nav className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium">
      <Link
        href="/"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="size-3.5" />
        <span className="sr-only">Home</span>
      </Link>

      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1
        const href = `/${segments.slice(0, index + 1).join('/')}`

        const isTechnicalId = segment.length > 20 || (segment.includes('-') && segment.length > 8)
        const label = isTechnicalId
          ? `#${formatShortId(segment)}`
          : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

        return (
          <div
            key={href}
            className={cn(
              'flex items-center gap-1 sm:gap-1.5',
              !showOnMobile(index) && 'hidden sm:flex'
            )}
          >
            <ChevronRight className="size-3 sm:size-3.5 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-semibold text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[100px]"
              >
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
